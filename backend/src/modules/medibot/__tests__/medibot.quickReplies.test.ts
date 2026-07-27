import { extractQuickReplies } from '../medibot.quickReplies'

describe('extractQuickReplies', () => {
  it('extracts the options declared by the model and strips the marker', () => {
    const { text, options } = extractQuickReplies(
      'Souhaitez-vous réserver avec le Dr Koffi ?\n[[choix: Oui | Non]]',
    )
    expect(text).toBe('Souhaitez-vous réserver avec le Dr Koffi ?')
    expect(options).toEqual(['Oui', 'Non'])
  })

  it('supports non binary choices and a single bracket pair', () => {
    const { text, options } = extractQuickReplies(
      'Préférez-vous le cabinet ou la téléconsultation ? [choix: Au cabinet | En téléconsultation]',
    )
    expect(text).toBe('Préférez-vous le cabinet ou la téléconsultation ?')
    expect(options).toEqual(['Au cabinet', 'En téléconsultation'])
  })

  it('drops duplicated, empty and overlong options', () => {
    const { options } = extractQuickReplies(
      `D'accord ? [[choix: Oui | oui |  | ${'x'.repeat(40)} | Non]]`,
    )
    expect(options).toEqual(['Oui', 'Non'])
  })

  it('falls back to Oui/Non when the model forgets the marker', () => {
    expect(extractQuickReplies('Voulez-vous que je cherche un dermatologue ?').options).toEqual([
      'Oui',
      'Non',
    ])
    expect(extractQuickReplies('Avez-vous de la fièvre ?').options).toEqual(['Oui', 'Non'])
  })

  it('does not guess buttons for open or alternative questions', () => {
    expect(extractQuickReplies('Quels sont vos symptômes ?').options).toEqual([])
    expect(extractQuickReplies('Décrivez-moi votre douleur.').options).toEqual([])
    expect(extractQuickReplies('Voulez-vous le matin ou l’après-midi ?').options).toEqual([])
    expect(
      extractQuickReplies("Voici les praticiens trouvés. Dites-moi lequel vous intéresse ?").options,
    ).toEqual([])
  })

  it('only considers the closing question', () => {
    const { options } = extractQuickReplies(
      'Avez-vous déjà consulté ? Peu importe. Quel jour vous conviendrait ?',
    )
    expect(options).toEqual([])
  })

  it('leaves a marker-free answer untouched', () => {
    const raw = 'Ces symptômes orientent souvent vers la **Médecine Générale**.'
    expect(extractQuickReplies(raw)).toEqual({ text: raw, options: [] })
  })
})
