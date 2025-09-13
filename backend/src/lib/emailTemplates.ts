export function buildEmailTemplate(subject: string, content: string) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f6fa; margin: 0; padding: 0; color: #333; }
      .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(90deg, #080e29, #131b62); color: #ffffff; padding: 20px; text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
      .body { padding: 28px; font-size: 16px; line-height: 1.6; }
      .highlight { display: inline-block; margin: 20px 0; padding: 14px 24px; background-color: #131b62; color: #ffffff; border-radius: 6px; font-size: 22px; font-weight: bold; text-align: center; }
      .button { display: inline-block; padding: 12px 24px; background-color: #080e29; color: #ffffff !important; border-radius: 6px; font-size: 16px; font-weight: bold; text-decoration: none; }
      .footer { background: #f0f0f0; padding: 18px; text-align: center; font-size: 13px; color: #666; }
      a { color: #131b62; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Counseling Platform</div>
      <div class="body">${content}</div>
      <div class="footer">© ${new Date().getFullYear()} Counseling Platform. All rights reserved.</div>
    </div>
  </body>
  </html>
  `;
}
