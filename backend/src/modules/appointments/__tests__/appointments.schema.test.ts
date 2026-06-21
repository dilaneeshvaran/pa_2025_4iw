import { toggleEarlierSlotAlertSchema } from '../appointments.schema'

describe('appointments.schema', () => {
  describe('toggleEarlierSlotAlertSchema', () => {
    it('accepte un booléen enabled', () => {
      expect(toggleEarlierSlotAlertSchema.parse({ enabled: true })).toEqual({
        enabled: true,
      })
      expect(toggleEarlierSlotAlertSchema.parse({ enabled: false })).toEqual({
        enabled: false,
      })
    })

    it('refuse une valeur enabled non booléenne', () => {
      expect(() =>
        toggleEarlierSlotAlertSchema.parse({ enabled: 'true' }),
      ).toThrow()
    })
  })
})
