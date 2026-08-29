const fs =
  require("node:fs");

const appFile =
  process.argv[2];

const mobileFile =
  process.argv[3];

let app =
  fs.readFileSync(
    appFile,
    "utf8"
  );

let mobile =
  fs.readFileSync(
    mobileFile,
    "utf8"
  );


/*
 * ========================================================
 * MOBILE LOGOUT BUTTON
 * ========================================================
 */

if (
  !mobile.includes(
    'action="/api/rkn/native-logout"'
  )
) {
  const menuStart =
    mobile.indexOf(
      '{panel === "menu" && ('
    );

  if (menuStart < 0) {
    throw new Error(
      "MOBILE_MENU_PANEL_NOT_FOUND"
    );
  }

  const fragmentClose =
    `              </>
            )}`;

  const closeIndex =
    mobile.indexOf(
      fragmentClose,
      menuStart
    );

  if (closeIndex < 0) {
    throw new Error(
      "MOBILE_MENU_FRAGMENT_END_NOT_FOUND"
    );
  }

  const logoutForm = `              <form
                action="/api/rkn/native-logout"
                method="post"
                className={styles.logoutForm}
              >
                <button
                  type="submit"
                  className={styles.logoutButton}
                >
                  <span
                    className={styles.logoutIcon}
                    aria-hidden="true"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 5H5v14h5" />
                      <path d="M14 8l4 4-4 4" />
                      <path d="M18 12H9" />
                    </svg>
                  </span>

                  <span
                    className={styles.logoutCopy}
                  >
                    <strong>
                      Keluar dari RKN ERP
                    </strong>

                    <small>
                      Akhiri sesi di perangkat ini
                    </small>
                  </span>

                  <span
                    className={styles.logoutArrow}
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>
              </form>

`;

  mobile =
    mobile.slice(
      0,
      closeIndex
    ) +
    logoutForm +
    mobile.slice(
      closeIndex
    );
}


/*
 * ========================================================
 * HIDE MANUAL ORDER IMPORT UI
 *
 * Engine remains in source as recovery.
 * ========================================================
 */

if (
  !app.includes(
    "rkn-order-manual-import-recovery"
  )
) {
  const importTitle =
    "<strong>Import Pesanan Marketplace</strong>";

  const importIndex =
    app.indexOf(
      importTitle
    );

  if (importIndex < 0) {
    throw new Error(
      "ORDER_IMPORT_TITLE_NOT_FOUND"
    );
  }

  const panelNeedle =
    '<div className="panel" style={{ padding: 18 }}>';

  const panelIndex =
    app.lastIndexOf(
      panelNeedle,
      importIndex
    );

  if (panelIndex < 0) {
    throw new Error(
      "ORDER_IMPORT_PANEL_NOT_FOUND"
    );
  }

  const replacement =
    '<div className="panel rkn-order-manual-import-recovery" style={{ padding: 18 }}>';

  app =
    app.slice(
      0,
      panelIndex
    ) +
    replacement +
    app.slice(
      panelIndex +
      panelNeedle.length
    );
}


/*
 * Replace old operational description
 * without touching order engine.
 */
app =
  app.replace(
    /Import pesanan marketplace tanpa credential\. ERP akan mendeteksi\s*marketplace, akun, SKU jual, dan kebutuhan allocation\./g,
    "Pesanan marketplace dipusatkan untuk integrasi API dan proses fulfillment. Jalur file manual disimpan sebagai recovery internal."
  );


fs.writeFileSync(
  appFile,
  app,
  "utf8"
);

fs.writeFileSync(
  mobileFile,
  mobile,
  "utf8"
);

console.log(
  "MOBILE_LOGOUT_BUTTON_PASS"
);

console.log(
  "ORDER_MANUAL_IMPORT_UI_HIDE_PATCH_PASS"
);