import tls from "node:tls";

const ZOHO_SMTP_HOST = "smtp.zoho.com";
const ZOHO_SMTP_PORT = 465;
const ZOHO_SENDER_EMAIL = "adminrkn@rkngroup.my.id";
const ZOHO_APP_PASS = "hK5yTuizTDdW";
const ADMIN_NOTIFICATION_EMAIL = "adminrkn@rkngroup.my.id";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Zoho SMTP (Port 465 SSL)
 */
export async function sendZohoEmail(options: SendEmailOptions): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: ZOHO_SMTP_HOST,
          port: ZOHO_SMTP_PORT,
          rejectUnauthorized: false,
          timeout: 8000,
        },
        () => {}
      );

      socket.setEncoding("utf8");

      let step = 0;
      let buffer = "";

      const cleanup = () => {
        try {
          socket.removeAllListeners();
          socket.end();
          socket.destroy();
        } catch {}
      };

      socket.on("data", (chunk) => {
        buffer += chunk;
        if (buffer.includes("\r\n")) {
          const lines = buffer.split("\r\n");
          const lastLine = lines[lines.length - 2] || lines[0];

          if (step === 0 && lastLine.startsWith("220")) {
            step = 1;
            buffer = "";
            socket.write("EHLO rkngroup.my.id\r\n");
          } else if (step === 1 && lastLine.startsWith("250 ")) {
            step = 2;
            buffer = "";
            socket.write("AUTH LOGIN\r\n");
          } else if (step === 2 && lastLine.startsWith("334")) {
            step = 3;
            buffer = "";
            socket.write(Buffer.from(ZOHO_SENDER_EMAIL).toString("base64") + "\r\n");
          } else if (step === 3 && lastLine.startsWith("334")) {
            step = 4;
            buffer = "";
            socket.write(Buffer.from(ZOHO_APP_PASS).toString("base64") + "\r\n");
          } else if (step === 4 && lastLine.startsWith("235")) {
            step = 5;
            buffer = "";
            socket.write(`MAIL FROM:<${ZOHO_SENDER_EMAIL}>\r\n`);
          } else if (step === 5 && lastLine.startsWith("250")) {
            step = 6;
            buffer = "";
            socket.write(`RCPT TO:<${options.to}>\r\n`);
          } else if (step === 6 && lastLine.startsWith("250")) {
            step = 7;
            buffer = "";
            socket.write("DATA\r\n");
          } else if (step === 7 && lastLine.startsWith("354")) {
            step = 8;
            buffer = "";
            const rawMessage = [
              `From: "RKN GROUP" <${ZOHO_SENDER_EMAIL}>`,
              `To: <${options.to}>`,
              `Subject: ${options.subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=UTF-8`,
              ``,
              options.html,
              `.`,
              ``,
            ].join("\r\n");
            socket.write(rawMessage);
          } else if (step === 8 && lastLine.startsWith("250")) {
            cleanup();
            resolve(true);
          } else if (lastLine.startsWith("5") || lastLine.startsWith("4")) {
            cleanup();
            console.error("ZOHO_SMTP_FAIL:", lastLine);
            resolve(false);
          }
        }
      });

      socket.on("error", (err) => {
        console.error("ZOHO_SMTP_SOCKET_ERROR:", err.message);
        cleanup();
        resolve(false);
      });

      socket.on("timeout", () => {
        console.error("ZOHO_SMTP_TIMEOUT");
        cleanup();
        resolve(false);
      });
    } catch (e) {
      console.error("ZOHO_SMTP_UNCAUGHT_ERROR:", e);
      resolve(false);
    }
  });
}

function emailLayout(content: string): string {
  return `
    <div style="background-color: #060e19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 16px; min-height: 100%;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #0c1b2e; border: 1px solid #1e3a5f; border-radius: 14px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
        <tr>
          <td style="padding: 24px 28px; background: #0a1626; border-bottom: 2px solid #3b82f6;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <strong style="color: #ffffff; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase;">RKN GROUP</strong>
                  <div style="color: #94a3b8; font-size: 11px; margin-top: 2px; letter-spacing: 0.05em;">PLASTIC TRADING ENTERPRISE SYSTEM</div>
                </td>
                <td align="right">
                  <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 10px; font-weight: 700;">OFFICIAL NOTIFICATION</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 28px; background: #071220; border-top: 1px solid #162a45; color: #64748b; font-size: 11px; text-align: center; line-height: 1.5;">
            Email ini dikirim otomatis oleh sistem RKN ERP dari domain resmi <strong>rkngroup.my.id</strong>.<br/>
            &copy; 2026 RKN GROUP · All Rights Reserved.
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * 1. Email ke Pengguna saat baru mendaftar
 */
export async function sendSignupReceivedEmail(params: {
  to: string;
  fullName: string;
  username: string;
  requestedRole: string;
}) {
  const roleDisplay =
    params.requestedRole === "SUPPLIER"
      ? "Supplier (Pemantau Stok)"
      : params.requestedRole === "ADMIN"
      ? "Admin (Operasional)"
      : params.requestedRole === "SUPERVISI"
      ? "Supervisi (Pengawas / Auditor)"
      : params.requestedRole === "OWNER"
      ? "Owner (Pemilik Bisnis)"
      : params.requestedRole;

  const html = emailLayout(`
    <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 12px;">Pendaftaran Akun Diterima</h2>
    <p>Halo <strong>${params.fullName}</strong>,</p>
    <p>Terima kasih telah mendaftar di sistem <strong>RKN ERP (Plastic Trading)</strong>.</p>
    
    <div style="background: #0f243d; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
        <tr>
          <td width="140" style="color: #94a3b8;">Username</td>
          <td>: <strong style="color: #ffffff;">@${params.username}</strong></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Email Terdaftar</td>
          <td>: ${params.to}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Akses Diajukan</td>
          <td>: <span style="color: #38bdf8; font-weight: 700;">${roleDisplay}</span></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Status Akun</td>
          <td>: <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-weight: 700; font-size: 11px;">MENUNGGU APPROVAL</span></td>
        </tr>
      </table>
    </div>

    <p style="color: #94a3b8; font-size: 13px;">
      Demi keamanan data perusahaan, akun Anda sedang menunggu verifikasi dan persetujuan dari Administrator / Owner RKN. Anda akan menerima email pemberitahuan setelah akun diaktifkan.
    </p>
  `);

  return sendZohoEmail({
    to: params.to,
    subject: "Pendaftaran Akun RKN ERP Berhasil Diterima",
    html,
  });
}

/**
 * 2. Email ke Owner / Admin saat ada pendaftar baru
 */
export async function sendAdminSignupAlertEmail(params: {
  fullName: string;
  username: string;
  email: string;
  whatsapp: string;
  requestedRole: string;
}) {
  const html = emailLayout(`
    <h2 style="color: #38bdf8; font-size: 20px; margin-top: 0; margin-bottom: 12px;">Pemberitahuan Pendaftar Baru</h2>
    <p>Halo Administrator / Owner,</p>
    <p>Ada pendaftaran akun internal baru di <strong>RKN ERP</strong> yang membutuhkan persetujuan Anda:</p>
    
    <div style="background: #0f243d; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
        <tr>
          <td width="130" style="color: #94a3b8;">Nama Lengkap</td>
          <td>: <strong style="color: #ffffff;">${params.fullName}</strong></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Username</td>
          <td>: @${params.username}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Email</td>
          <td>: <a href="mailto:${params.email}" style="color: #38bdf8;">${params.email}</a></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">WhatsApp</td>
          <td>: <a href="https://wa.me/${params.whatsapp}" target="_blank" style="color: #34d399;">${params.whatsapp}</a></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Akses Diajukan</td>
          <td>: <strong style="color: #fbbf24;">${params.requestedRole}</strong></td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://rkngroup.my.id/admin/users" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
        Buka Panel Approval SDM & Akses &rarr;
      </a>
    </div>
  `);

  return sendZohoEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `[RKN ERP] Pendaftar Baru: ${params.fullName} (${params.requestedRole})`,
    html,
  });
}

/**
 * 3. Email ke Pengguna saat Akun telah disetujui (Approved)
 */
export async function sendAccountApprovedEmail(params: {
  to: string;
  fullName: string;
  roleCode: string;
  accessLevel: string;
}) {
  const html = emailLayout(`
    <h2 style="color: #34d399; font-size: 20px; margin-top: 0; margin-bottom: 12px;">Akun Anda Telah Disetujui!</h2>
    <p>Halo <strong>${params.fullName}</strong>,</p>
    <p>Kabar baik! Permintaan akses akun <strong>RKN ERP</strong> Anda telah disetujui oleh Administrator.</p>
    
    <div style="background: #0f243d; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
        <tr>
          <td width="130" style="color: #94a3b8;">Peran ERP</td>
          <td>: <strong style="color: #38bdf8;">${params.roleCode}</strong></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Level Akses</td>
          <td>: <strong style="color: #34d399;">${params.accessLevel}</strong></td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Status</td>
          <td>: <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700; font-size: 11px;">AKTIF</span></td>
        </tr>
      </table>
    </div>

    <p>Anda sekarang dapat login dan mengakses modul Plastic Trading sesuai peran yang diberikan.</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://rkngroup.my.id/plastic-trading" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(16,185,129,0.4);">
        Masuk ke RKN ERP &rarr;
      </a>
    </div>
  `);

  return sendZohoEmail({
    to: params.to,
    subject: "Selamat! Akun RKN ERP Anda Telah Disetujui & Aktif",
    html,
  });
}
