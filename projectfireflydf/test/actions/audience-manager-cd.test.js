/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  AudienceManagerCD: {
    init: jest.fn()
  },
  Core: {
    Logger: jest.fn()
  }
}))
  
const { Core, AudienceManagerCD } = require('@adobe/aio-sdk')
const mockAudienceManagerCDInstance = { getProfile: jest.fn() }
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)
AudienceManagerCD.init.mockResolvedValue(mockAudienceManagerCDInstance)

const action = require('./../../actions/audience-manager-cd/index.js')
  
beforeEach(() => {
  AudienceManagerCD.init.mockClear() // only clears calls stats
  mockAudienceManagerCDInstance.getProfile.mockReset() // clears calls + mock implementation

  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})
  
const fakeRequestParams = { apiKey: 'fakeKey', id: 'fakeId', dataSourceId: 'fakeDataSourceId', __ow_headers: { authorization: 'Bearer fakeToken', 'x-gw-ims-org-id': 'fakeOrgId' } }
describe('audience-manager-cd', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ ...fakeRequestParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })
  test('AudienceManagerCD sdk should be initialized with input credentials', async () => {
    await action.main({ ...fakeRequestParams, otherParam: 'fake4' })
    expect(AudienceManagerCD.init).toHaveBeenCalledWith('fakeOrgId', 'fakeKey', 'fakeToken')
  })
  test('should return an http response with AudienceManagerCD profiles', async () => {
    const fakeResponse = { profiles: 'fake' }
    mockAudienceManagerCDInstance.getProfile.mockResolvedValue(fakeResponse)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      statusCode: 200,
      body: fakeResponse
    })
  })
  test('if there is an error should return a 500 and log the error', async () => {
    const fakeError = new Error('fake')
    mockAudienceManagerCDInstance.getProfile.mockRejectedValue(fakeError)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    })
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })
  test('missing input request parameters, should return 400', async () => {
    const response = await action.main({})
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing header(s) \'authorization,x-gw-ims-org-id\' and missing parameter(s) \'apiKey,id,dataSourceId\'' }
      }
    })
  })
})
