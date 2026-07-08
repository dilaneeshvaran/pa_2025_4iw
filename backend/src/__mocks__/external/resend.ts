export class Resend {
  emails = {
    send: jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
  }

  constructor(public apiKey?: string) {}
}
