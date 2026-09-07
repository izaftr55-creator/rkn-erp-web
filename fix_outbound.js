const fs = require('fs');
let code = fs.readFileSync('C:/RKN-ERP/rkn-erp-web/components/PlasticTradingApp.tsx', 'utf-8');

const target1 = 'const [viewInvoice, setViewInvoice] = useState<Row | null>(null);';
const replacement1 = `const [viewInvoice, setViewInvoice] = useState<Row | null>(null);
  const [payInvoice, setPayInvoice] = useState<Row | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("TRANSFER");

  const submitPay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payInvoice) return;
    const amountRp = Number(payAmount || 0);
    const outstandingRp = Number(payInvoice.outstandingRp || 0);
    if (amountRp <= 0) {
      window.alert("Nominal pembayaran harus lebih dari Rp. 0.");
      return;
    }
    if (amountRp > outstandingRp) {
      window.alert(\`Nominal melebihi sisa piutang \${money.format(outstandingRp)}.\`);
      return;
    }
    await run(
      "ADD_PAYMENT",
      {
        invoiceId: payInvoice.invoiceId,
        amountRp,
        paymentMethod: payMethod,
        dateKey: today(),
      },
      "OUTBOUND"
    );
    setPayInvoice(null);
    setPayAmount("");
  };`;
code = code.replace(target1, replacement1);

const target2 = `                        <button
                          type="button"
                          className={styles.inlineDangerButton}
                          onClick={() => voidSale(row)}
                        >
                          Hapus
                        </button>
                      </>
                    ) : null}`;

const replacement2 = `                        <button
                          type="button"
                          className={styles.inlineDangerButton}
                          onClick={() => voidSale(row)}
                        >
                          Hapus
                        </button>
                      </>
                    ) : null}
                    {Number(row.outstandingRp || 0) > 0 && String(row.historyIntegrity || "OK") === "OK" ? (
                      <button
                        type="button"
                        className={styles.inlineEditButton}
                        style={{
                          background: "rgba(39, 174, 96, 0.15)",
                          color: "#2ecc71",
                          borderColor: "rgba(39, 174, 96, 0.35)",
                        }}
                        onClick={() => {
                           setPayInvoice(row);
                           setPayAmount(String(row.outstandingRp || ""));
                        }}
                      >
                        Bayar
                      </button>
                    ) : null}`;

code = code.split(target2).join(replacement2);

const target3 = `{viewInvoice ? (`;
const replacement3 = `{payInvoice ? (
          <div
            className={styles.modalOverlay}
            onClick={() => setPayInvoice(null)}
          >
            <div
              className={styles.modalPanel}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "480px" }}
            >
              <div className={styles.modalHead}>
                <div className={styles.modalHeadTitle}>
                  <span>PEMBAYARAN PIUTANG</span>
                  <h3>{payInvoice.invoiceNo}</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPayInvoice(null)}
                  aria-label="Tutup"
                >
                  X
                </button>
              </div>

              <div className={styles.modalBody}>
                <form onSubmit={submitPay} className={styles.formStack}>
                  <div className={styles.modalDetailHeader}>
                    <div>
                      <span>Customer</span>
                      <strong>{payInvoice.customerName}</strong>
                    </div>
                    <div>
                      <span>Sisa Piutang</span>
                      <strong style={{ color: "#d4b27d" }}>
                        {money.format(Number(payInvoice.outstandingRp || 0))}
                      </strong>
                    </div>
                  </div>

                  <Field label="Metode Pembayaran">
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      required
                    >
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="TUNAI">Tunai / Cash</option>
                      <option value="CEK_GIRO">Cek / Giro</option>
                    </select>
                  </Field>

                  <Field label="Nominal Bayar (Rp)">
                    <input
                      type="number"
                      required
                      min="1"
                      max={Number(payInvoice.outstandingRp || 0)}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Contoh: 1500000"
                    />
                    {Number(payAmount) > 0 && Number(payAmount) < Number(payInvoice.outstandingRp || 0) && (
                      <small className={styles.stockWarningNote} style={{ marginTop: 4 }}>
                        Status: Akan menjadi Belum Lunas (Sisa: {money.format(Number(payInvoice.outstandingRp || 0) - Number(payAmount))})
                      </small>
                    )}
                    {Number(payAmount) > 0 && Number(payAmount) === Number(payInvoice.outstandingRp || 0) && (
                      <small style={{ color: "#2ecc71", display: "block", marginTop: 4, fontSize: 12 }}>
                        Status: Akan menjadi LUNAS
                      </small>
                    )}
                  </Field>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setPayInvoice(null)}
                      disabled={busy}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={busy || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > Number(payInvoice.outstandingRp || 0)}
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
        
        {viewInvoice ? (`;

code = code.replace(target3, replacement3);

fs.writeFileSync('C:/RKN-ERP/rkn-erp-web/components/PlasticTradingApp.tsx', code);
console.log('Done modifying frontend');
