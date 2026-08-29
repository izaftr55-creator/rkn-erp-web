/* RKN_HUMAN_COPY_V1 */
"use client";

import {
  useEffect,
  useState,
} from "react";

import ERPUserBadge from "./ERPUserBadge";
import SablonWorkerMaster from "./SablonWorkerMaster";

import styles from "./RoleWorkspace.module.css";

type WorkspaceModule = {
  label: string;
  enabled?: boolean;
};

type Props = {
  workspaceName: string;
  subtitle: string;
  accessLabel: string;
  modules: WorkspaceModule[];
};

export default function RoleWorkspace({
  workspaceName,
  subtitle,
  accessLabel,
  modules,
}: Props) {
  const firstEnabled =
    modules.find(
      (item) => item.enabled
    )?.label ??
    modules[0]?.label ??
    "DASHBOARD";

  const [
    activeModule,
    setActiveModule,
  ] = useState("");

  const [
    moduleReady,
    setModuleReady,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const isSablon =
    workspaceName ===
    "SABLON PLASTIK";
  /* RKN ACTIVE MODULE PERSISTENCE V3 - HYDRATION SAFE */
  const moduleStorageKey =
    `rkn-erp:active-module:${workspaceName}:${accessLabel}`;

  useEffect(() => {
    let resolvedModule =
      firstEnabled;

    try {
      const savedModule =
        window.localStorage.getItem(
          moduleStorageKey
        );

      const savedModuleIsAllowed =
        Boolean(savedModule) &&
        modules.some(
          (item) =>
            item.enabled &&
            item.label === savedModule
        );

      if (
        savedModule &&
        savedModuleIsAllowed
      ) {
        resolvedModule =
          savedModule;
      }
      else {
        window.localStorage.setItem(
          moduleStorageKey,
          firstEnabled
        );
      }
    }
    catch {
      resolvedModule =
        firstEnabled;
    }

    setActiveModule(
      resolvedModule
    );

    setModuleReady(
      true
    );
  }, [
    moduleStorageKey,
    firstEnabled,
  ]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [mobileMenuOpen]);

  function selectModule(
    item: WorkspaceModule
  ) {
    if (!item.enabled) {
      return;
    }

    setActiveModule(
      item.label
    );

    try {
      window.localStorage.setItem(
        moduleStorageKey,
        item.label
      );
    }
    catch {
      // Local storage tidak tersedia.
    }

    setMobileMenuOpen(false);
  }

  return (
    <div
      className={`${styles.shell} ${
        moduleReady
          ? styles.shellReady
          : styles.shellBooting
      }`}
      aria-busy={!moduleReady}
    >
      <button
        type="button"
        aria-label="Tutup navigasi"
        className={`${styles.backdrop} ${
          mobileMenuOpen
            ? styles.backdropOpen
            : ""
        }`}
        onClick={() =>
          setMobileMenuOpen(false)
        }
      />

      <aside
        className={`${styles.sidebar} ${
          mobileMenuOpen
            ? styles.sidebarOpen
            : ""
        }`}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.brandBlock}>
            <div className={styles.logoBox}>
              <img
                src="/rkn-logo.png"
                alt="RKN"
              />
            </div>

            <div className={styles.brandCopy}>
              <strong>RKN ERP</strong>
              <span>MODUL BERIKUTNYA</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            aria-label="Tutup menu"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            ×
          </button>
        </div>

        <div className={styles.workspaceCard}>
          <span>AREA AKTIF</span>

          <strong>
            {workspaceName}
          </strong>

          <small>
            {accessLabel}
          </small>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>
            NAVIGATION
          </div>

          {modules.map(
            (item, index) => {
              const active =
                activeModule ===
                item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={
                    !item.enabled
                  }
                  onClick={() =>
                    selectModule(item)
                  }
                  className={`${styles.navItem} ${
                    active
                      ? styles.active
                      : ""
                  }`}
                >
                  <span
                    className={
                      styles.navMarker
                    }
                  />

                  <span
                    className={
                      styles.navNumber
                    }
                  >
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <span
                    className={
                      styles.navText
                    }
                  >
                    {item.label}
                  </span>

                  {!item.enabled ? (
                    <span
                      className={
                        styles.soon
                      }
                    >
                      SOON
                    </span>
                  ) : null}
                </button>
              );
            }
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.secureLine}>
            <span
              className={
                styles.secureDot
              }
            />
            SECURE SESSION
          </div>

          <div className={styles.userArea}>
            <ERPUserBadge />
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.mobileIdentity}>
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Buka menu"
              onClick={() =>
                setMobileMenuOpen(true)
              }
            >
              <span />
              <span />
              <span />
            </button>

            <img
              src="/rkn-logo.png"
              alt="RKN"
            />

            <strong>
              RKN ERP
            </strong>
          </div>

          <div className={styles.breadcrumb}>
            <span>RKN ERP</span>
            <i>/</i>
            <strong>
              {workspaceName}
            </strong>
          </div>

          <div className={styles.topStatus}>
            <span />
            SYSTEM ONLINE
          </div>
        </header>

        <div className={styles.viewport}>
          <header className={styles.hero}>
            <div>
              <div className={styles.eyebrow}>
                {accessLabel}
              </div>

              <h1>
                {activeModule}
              </h1>

              <p>
                {subtitle}
              </p>
            </div>

            <div className={styles.heroBadge}>
              <span>WORKSPACE</span>
              <strong>ACTIVE</strong>
            </div>
          </header>

          <section className={styles.content}>
            {
              isSablon &&
              activeModule ===
                "MASTER PEKERJA"
                ? (
                  <SablonWorkerMaster />
                )
                : (
                  <article
                    className={
                      styles.panel
                    }
                  >
                    <div
                      className={
                        styles.panelGlow
                      }
                    />

                    <div
                      className={
                        styles.panelLabel
                      }
                    >
                      WORKSPACE AKTIF
                    </div>

                    <h2>
                      {workspaceName}
                    </h2>

                    <p>
                      MODUL{" "}
                      {activeModule} AKTIF.
                      FITUR SELANJUTNYA
                      AKAN DIBANGUN SESUAI
                      ROLE DAN BUSINESS
                      SCOPE.
                    </p>

                    <div
                      className={
                        styles.panelMeta
                      }
                    >
                      <span>
                        RKN ERP
                      </span>

                      <span>
                        {accessLabel}
                      </span>
                    </div>
                  </article>
                )
            }
          </section>
        </div>
      </main>
    </div>
  );
}
