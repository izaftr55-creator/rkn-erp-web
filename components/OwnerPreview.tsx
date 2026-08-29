import ERPUserBadge from "./ERPUserBadge";

const ownerMenus = [
  {
    code: "01",
    title: "RINGKASAN GRUP",
    items: [
      "Ringkasan Eksekutif",
      "Kinerja Hari Ini",
      "Posisi Dana Grup",
      "Peringatan Utama",
    ],
  },
  {
    code: "02",
    title: "PENJUALAN & MARKETPLACE",
    items: [
      "Dasbor Penjualan",
      "Penjualan Marketplace",
      "Kinerja per Toko",
      "Settlement Marketplace",
      "Dana dalam Pencairan",
      "Konfirmasi Dana Masuk",
    ],
  },
  {
    code: "03",
    title: "STOK & PERSEDIAAN",
    items: [
      "Dasbor Persediaan",
      "Stok Fisik",
      "Barang Dagang",
      "Stok Opname",
      "Nilai Persediaan",
      "Selisih Stok",
      "Riwayat Persediaan",
    ],
  },
  {
    code: "04",
    title: "KEUANGAN",
    items: [
      "Dasbor Keuangan",
      "Kas & Bank",
      "Pemasukan",
      "Pengeluaran",
      "Hutang Vendor",
      "Piutang",
      "Arus Kas",
      "Laba Rugi",
      "Neraca",
    ],
  },
  {
    code: "05",
    title: "DANA PEMILIK",
    items: [
      "Dasbor Dana Pemilik",
      "Laba Bersih Grup",
      "Dana Ditahan untuk Usaha",
      "Hak Tarik Pemilik",
      "Realisasi Prive",
      "Sisa Hak Tarik",
      "Riwayat Dana Pemilik",
    ],
  },
  {
    code: "06",
    title: "UNIT USAHA",
    items: [
      "Marketplace",
      "Sablon",
      "Plastik & Packaging",
      "Konsolidasi Grup",
    ],
  },
  {
    code: "07",
    title: "SDM & PAYROLL",
    items: [
      "Ringkasan SDM",
      "Payroll",
      "Kasbon",
      "Kehadiran",
      "Produktivitas",
    ],
  },
  {
    code: "08",
    title: "LAPORAN & ANALITIK",
    items: [
      "Laporan Penjualan",
      "Laporan Persediaan",
      "Laporan Stok Opname",
      "Laporan Keuangan",
      "Laporan Payroll",
      "Laporan Eksekutif",
      "Pusat Ekspor",
    ],
  },
  {
    code: "09",
    title: "AUDIT & KENDALI",
    items: [
      "Pusat Persetujuan",
      "Pusat Peringatan",
      "Log Audit",
      "Status Integrasi",
    ],
  },
];

const kpis = [
  ["PENJUALAN GRUP", "Rp —", "Data penjualan belum diaktifkan"],
  ["LABA BERSIH", "Rp —", "Perhitungan laba belum diaktifkan"],
  ["KAS & BANK", "Rp —", "Saldo menunggu integrasi ledger"],
  ["PERSEDIAAN FISIK", "— unit", "Sumber: stok fisik ERP"],
  ["HUTANG VENDOR", "Rp —", "Pengadaan belum diaktifkan"],
  ["DANA MARKETPLACE", "Rp —", "Settlement belum diaktifkan"],
  ["HAK TARIK PEMILIK", "Rp —", "Kebijakan belum diaktifkan"],
  ["PRIVE DIREALISASI", "Rp —", "Belum ada transaksi"],
];

export default function OwnerPreview() {
  return (
    <div className="owner-preview-shell">
      {/* RKN_OWNER_PREVIEW_UI_V1 */}

      <aside className="owner-preview-sidebar">
        <div className="owner-preview-brand">
          <div className="owner-preview-logo">
            <img src="/rkn-logo.png" alt="RKN" />
          </div>

          <div>
            <strong>RKN ERP</strong>
            <span>OWNER CONTROL TOWER</span>
          </div>
        </div>

        <div className="owner-preview-role">
          <span>AKSES PEMILIK</span>
          <strong>RKN GROUP</strong>
          <small>VIEW ONLY · MODE PRATINJAU</small>
        </div>

        <nav className="owner-preview-nav">
          {ownerMenus.map((group, index) => (
            <details
              className="owner-preview-nav-group"
              key={group.code}
              open={index === 0}
            >
              <summary>
                <span>{group.code}</span>

                <strong>
                  {group.title}
                </strong>

                <i>+</i>
              </summary>

              <div className="owner-preview-nav-items">
                {group.items.map((item) => (
                  <button
                    type="button"
                    disabled
                    key={item}
                  >
                    <span>{item}</span>
                    <small>PRATINJAU</small>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </nav>

        <div className="owner-preview-user">
          <ERPUserBadge />
        </div>
      </aside>


      <main className="owner-preview-main">

        <header className="owner-preview-topbar">
          <div>
            <span className="owner-preview-kicker">
              RKN GROUP · EXECUTIVE MONITORING
            </span>

            <h1>
              Ringkasan Grup
            </h1>

            <p>
              Pusat monitoring terintegrasi seluruh unit usaha RKN.
            </p>
          </div>

          <div className="owner-preview-top-status">
            <span>MODE PRATINJAU</span>
            <strong>VIEW ONLY</strong>
          </div>
        </header>


        <section className="owner-preview-banner">
          <div className="owner-preview-banner-icon">
            R
          </div>

          <div>
            <span>PRATINJAU SISTEM PEMILIK</span>

            <strong>
              RKN ERP Owner Control Tower
            </strong>

            <p>
              Struktur dasbor sedang dikembangkan.
              Data finansial dan operasional pada halaman ini
              belum diaktifkan sehingga tidak ada transaksi
              yang dapat dilakukan dari mode pratinjau.
            </p>
          </div>

          <div className="owner-preview-secure">
            <span>●</span>
            READ ONLY
          </div>
        </section>


        <section className="owner-preview-kpis">
          {kpis.map(([label, value, note]) => (
            <article
              className="owner-preview-kpi"
              key={label}
            >
              <span>{label}</span>

              <strong>{value}</strong>

              <small>{note}</small>

              <div className="owner-preview-kpi-line" />
            </article>
          ))}
        </section>


        <section className="owner-preview-grid">

          <article className="owner-preview-panel owner-preview-wide">
            <div className="owner-preview-panel-head">
              <div>
                <span>
                  ANALITIK PENJUALAN
                </span>

                <h2>
                  Tren Penjualan Grup
                </h2>

                <p>
                  Grafik akan mengambil data aktual seluruh
                  unit usaha setelah modul laporan aktif.
                </p>
              </div>

              <b>PRATINJAU</b>
            </div>

            <div className="owner-preview-chart">
              <div style={{ height: "34%" }} />
              <div style={{ height: "48%" }} />
              <div style={{ height: "41%" }} />
              <div style={{ height: "67%" }} />
              <div style={{ height: "55%" }} />
              <div style={{ height: "76%" }} />
              <div style={{ height: "63%" }} />
              <div style={{ height: "84%" }} />
              <div style={{ height: "71%" }} />
              <div style={{ height: "91%" }} />
              <div style={{ height: "78%" }} />
              <div style={{ height: "96%" }} />
            </div>

            <div className="owner-preview-chart-foot">
              <span>DATA BELUM TERHUBUNG</span>
              <span>PERIODE · —</span>
            </div>
          </article>


          <article className="owner-preview-panel">
            <div className="owner-preview-panel-head">
              <div>
                <span>
                  POSISI DANA
                </span>

                <h2>
                  Distribusi Dana Grup
                </h2>
              </div>
            </div>

            <div className="owner-preview-fund-list">
              {[
                "Kas & Bank",
                "Saldo Shopee",
                "Saldo TikTok",
                "Dalam Pencairan",
                "Menunggu Konfirmasi",
              ].map((item) => (
                <div key={item}>
                  <span>{item}</span>
                  <strong>Rp —</strong>
                </div>
              ))}
            </div>
          </article>


          <article className="owner-preview-panel">
            <div className="owner-preview-panel-head">
              <div>
                <span>
                  UNIT USAHA
                </span>

                <h2>
                  Kinerja per Unit
                </h2>
              </div>
            </div>

            <div className="owner-preview-business-list">
              <div>
                <span>01</span>
                <div>
                  <strong>Marketplace</strong>
                  <small>Penjualan · Profit · Settlement</small>
                </div>
                <b>—</b>
              </div>

              <div>
                <span>02</span>
                <div>
                  <strong>Sablon</strong>
                  <small>Produksi · Payroll · Operasional</small>
                </div>
                <b>—</b>
              </div>

              <div>
                <span>03</span>
                <div>
                  <strong>Plastik & Packaging</strong>
                  <small>Stok · Penjualan · Vendor</small>
                </div>
                <b>—</b>
              </div>
            </div>
          </article>


          <article className="owner-preview-panel owner-preview-wide">
            <div className="owner-preview-panel-head">
              <div>
                <span>
                  RINGKASAN
                </span>

                <h2>
                  Status Pengembangan Modul
                </h2>

                <p>
                  Tampilan berikut menunjukkan arsitektur
                  sistem yang sedang dibangun.
                </p>
              </div>
            </div>

            <div className="owner-preview-roadmap">
              <div>
                <span className="owner-preview-dot ready" />
                <strong>Autentikasi & Hak Akses</strong>
                <small>AKTIF</small>
              </div>

              <div>
                <span className="owner-preview-dot ready" />
                <strong>Marketplace Mapping Engine</strong>
                <small>AKTIF</small>
              </div>

              <div>
                <span className="owner-preview-dot preview" />
                <strong>Persediaan & Stok Fisik</strong>
                <small>TAHAP BERIKUTNYA</small>
              </div>

              <div>
                <span className="owner-preview-dot preview" />
                <strong>Keuangan & Settlement</strong>
                <small>TAHAP BERIKUTNYA</small>
              </div>

              <div>
                <span className="owner-preview-dot preview" />
                <strong>Laporan Eksekutif</strong>
                <small>TAHAP BERIKUTNYA</small>
              </div>
            </div>
          </article>

        </section>


        <footer className="owner-preview-footer">
          <span>
            RKN ERP · OWNER CONTROL TOWER
          </span>

          <span>
            MODE PRATINJAU · DATA OPERASIONAL TIDAK AKTIF
          </span>
        </footer>

      </main>
    </div>
  );
}
