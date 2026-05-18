'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Circle, Download, House, Plus, TrendingUp, Wallet } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell } from '../../../components/layout';
import { getCurrentTenantDashboard, getCurrentTenantWallets } from '../../tenant-portal/services';
import type { FmzTenantDashboard, FmzTenantWallet } from '../../tenant-portal/domain';
import styles from './FmzWalletPage.module.css';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const pctFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const tokenFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatPct = (v?: number | null) => `${pctFmt.format(Number(v ?? 0))}%`;
const formatToken = (v?: number | null) => tokenFmt.format(Number(v ?? 0));

const SPARKLINE_POINTS = 'M0,58 L40,56 L80,54 L120,50 L160,52 L200,46 L240,40 L280,38 L320,34 L360,32 L400,26 L440,24 L480,18 L520,14 L560,10 L600,6';
const SPARKLINE_AREA = `${SPARKLINE_POINTS} L600,64 L0,64 Z`;

function WalletHeroCard({ dashboard, wallets }: { dashboard: FmzTenantDashboard; wallets: FmzTenantWallet[] }) {
  const ownership = dashboard.ownership;
  const property = dashboard.property;
  const contract = dashboard.contract;
  const rentInsight = dashboard.rentInsight;
  const tokenBalance = ownership?.tokenBalance ?? 0;
  const ownedValue = ownership?.currentOwnedValue ?? 0;

  const walletId = wallets[0]?.id ?? wallets[0]?.walletAddress ?? null;
  const walletIdShort = walletId ? walletId.slice(-8).toUpperCase() : null;

  return (
    <div className={styles.walletCard}>
      <div className={styles.walletHead}>
        <span className={styles.walletEyebrow}>
          <Wallet size={11} />
          Saldo da carteira
        </span>
        {walletIdShort && <span className={styles.walletId}>{walletIdShort}</span>}
      </div>

      <div>
        <div className={styles.walletBalance}>
          <span className={styles.walletCurrency}>R$</span>
          {formatMoney(ownedValue).replace('R$ ', '').replace('R$ ', '')}
        </div>
        <div className={styles.walletMeta}>
          <span className={styles.walletChip}>
            <Circle size={10} fill="currentColor" />
            {formatToken(tokenBalance)} tokens
          </span>
          {ownership?.currentPercentage != null && (
            <span className={styles.walletGain}>
              <ArrowUp size={12} />
              {formatPct(ownership.currentPercentage)} de posse
            </span>
          )}
        </div>
      </div>

      <div className={styles.walletChart}>
        <svg viewBox="0 0 600 64" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8B620" stopOpacity=".35" />
              <stop offset="100%" stopColor="#E8B620" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={SPARKLINE_AREA} fill="url(#wfill)" />
          <path d={SPARKLINE_POINTS} fill="none" stroke="#E8B620" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="600" cy="6" r="3" fill="#E8B620" />
          <circle cx="600" cy="6" r="6" fill="#E8B620" opacity=".25" />
        </svg>
      </div>

      <div className={styles.distCard} style={{ display: 'flex', flexDirection: 'column', gap: 0, border: 'none', padding: 0, boxShadow: 'none', marginTop: 8 }}>
        {property && (
          <div className={styles.assetRow}>
            <div className={styles.assetThumb}><House size={20} /></div>
            <div className={styles.assetBody}>
              <div className={styles.assetName}>{property.name ?? property.code ?? 'Imóvel'}</div>
              <div className={styles.assetSub}>
                {property.code && <span>{property.code}</span>}
                {property.code && <span className={styles.assetSep}>·</span>}
                <span>{formatToken(tokenBalance)} tokens</span>
                <span className={styles.assetSep}>·</span>
                <span>{formatPct(ownership?.currentPercentage)} de posse</span>
              </div>
            </div>
            <div className={styles.assetVal}>
              <div className={styles.assetValAmt}>{formatMoney(ownedValue).replace('R$ ', 'R$ ')}</div>
              {ownership?.currentPercentage != null && (
                <div className={styles.assetValPct}>
                  <ArrowUp />{formatPct(ownership.currentPercentage)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.assetPerf}>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Compra mensal</span>
            <span className={styles.perfVal}>{formatMoney(contract?.baseMonthlyRent).replace('R$ ', 'R$ ')}</span>
          </div>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Dia de vencimento</span>
            <span className={styles.perfVal}>{contract?.paymentDay ?? '—'}</span>
          </div>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Aluguel economizado</span>
            <span className={`${styles.perfVal} ${styles.perfValGreen}`}>
              {formatMoney(rentInsight?.monthlySavingsAmount)}
              <span className={styles.perfUnit}>/mês</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDistributionCard({ dashboard, wallets }: { dashboard: FmzTenantDashboard; wallets: FmzTenantWallet[] }) {
  const ownership = dashboard.ownership;
  const property = dashboard.property;

  return (
    <div className={styles.distCard}>
      <div className={styles.distHead}>
        <span className={styles.distLabel}>Seus ativos</span>
        <span className={styles.distCount}>{property ? '1 imóvel' : '0 imóveis'}</span>
      </div>

      {property ? (
        <div className={styles.assetRow}>
          <div className={styles.assetThumb}><House size={20} /></div>
          <div className={styles.assetBody}>
            <div className={styles.assetName}>{property.name ?? property.code ?? 'Imóvel'}</div>
            <div className={styles.assetSub}>
              {property.code && <><span>{property.code}</span><span className={styles.assetSep}>·</span></>}
              <span>{formatToken(ownership?.tokenBalance)} tokens</span>
              <span className={styles.assetSep}>·</span>
              <span>{formatPct(ownership?.currentPercentage)} de posse</span>
            </div>
          </div>
          <div className={styles.assetVal}>
            <div className={styles.assetValAmt}>{formatMoney(ownership?.currentOwnedValue)}</div>
            {ownership?.currentPercentage != null && (
              <div className={styles.assetValPct}>
                <ArrowUp />{formatPct(ownership.currentPercentage)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--fmz-text-muted)', marginTop: 8 }}>Nenhum imóvel vinculado.</p>
      )}

      <div className={styles.distFoot}>
        <span>
          Tokens disponíveis <strong>{formatToken(ownership?.tokenBalance)}</strong>
        </span>
        <a href="#" className={styles.distFootLink}>
          Ver detalhes <ArrowRight size={12} />
        </a>
      </div>
    </div>
  );
}

function WalletAddressCards({ wallets }: { wallets: FmzTenantWallet[] }) {
  if (wallets.length === 0) return null;
  return (
    <div className={styles.walletList}>
      {wallets.map((w) => (
        <div key={w.id ?? w.walletAddress ?? w.publicKey} className={styles.walletItem}>
          <div className={styles.walletItemGrid}>
            <div>
              <p className={styles.walletItemLabel}>ID da wallet</p>
              <p className={styles.walletItemValue}>{w.id ?? 'Não informado'}</p>
            </div>
            <div>
              <p className={styles.walletItemLabel}>Endereço</p>
              <p className={styles.walletItemValue}>{w.walletAddress ?? w.publicKey ?? 'Não informado'}</p>
            </div>
          </div>
          <div className={styles.walletItemMeta}>
            <div><p className={styles.walletItemMetaKey}>Rede</p><p className={styles.walletItemMetaVal}>{w.chainId ?? '—'}</p></div>
            <div><p className={styles.walletItemMetaKey}>Tipo</p><p className={styles.walletItemMetaVal}>{w.walletType ?? '—'}</p></div>
            <div><p className={styles.walletItemMetaKey}>Custódia</p><p className={styles.walletItemMetaVal}>{w.custodyType ?? '—'}</p></div>
            <div><p className={styles.walletItemMetaKey}>Status</p><p className={styles.walletItemMetaVal}>{w.status ?? w.verificationStatus ?? '—'}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FmzWalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [wallets, setWallets] = useState<FmzTenantWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [data, wlts] = await Promise.all([
          getCurrentTenantDashboard(propertyId),
          getCurrentTenantWallets(),
        ]);
        if (active) { setDashboard(data); setWallets(wlts); }
      } catch {
        if (active) setErrorMessage('Não foi possível carregar os dados da carteira. Verifique se a sessão está ativa.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  const ownership = dashboard?.ownership;

  return (
    <FmzConnectedPageShell width="tenant">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-7 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-fmz-text-hint transition hover:text-fmz-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
      </button>

      {isLoading ? (
        <div className={styles.empty}>
          <span className={styles.spinner} />
          <p className={styles.emptyDesc}>Carregando carteira...</p>
        </div>
      ) : errorMessage ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Erro ao carregar</p>
          <p className={styles.emptyDesc}>{errorMessage}</p>
        </div>
      ) : (
        <>
          {/* Page head */}
          <div className={styles.pageHead}>
            <div className={styles.pageHeadLeft}>
              <h1>Carteira</h1>
              <p className={styles.pageSub}>
                {ownership?.tokenBalance != null && <span>{formatToken(ownership.tokenBalance)} tokens</span>}
                {dashboard?.property && <span>· {dashboard.property.name ?? dashboard.property.code ?? 'Imóvel'}</span>}
              </p>
            </div>
            <div className={styles.pageHeadRight}>
              <button type="button" className={styles.btn}><Download /> Extrato</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}><Plus /> Comprar tokens</button>
            </div>
          </div>

          {/* Hero */}
          {dashboard && (
            <section className={styles.hero}>
              <WalletHeroCard dashboard={dashboard} wallets={wallets} />
              <AssetDistributionCard dashboard={dashboard} wallets={wallets} />
            </section>
          )}

          {/* Metrics */}
          <section className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <Circle size={13} />
                Tokens em carteira
              </div>
              <div className={styles.metricValue}>
                {formatToken(ownership?.tokenBalance)}
                {ownership?.totalSupply != null && (
                  <span className={styles.metricSmall}>/ {formatToken(ownership.totalSupply)}</span>
                )}
              </div>
              <div className={styles.metricSub}>
                <span className={styles.tagGold}>{formatPct(ownership?.currentPercentage)} de posse</span>
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <TrendingUp size={13} />
                Valor adquirido
              </div>
              <div className={styles.metricValue}>{formatMoney(ownership?.currentOwnedValue)}</div>
              <div className={styles.metricSub}>
                <span className={styles.tagUp}>
                  <ArrowUp size={9} />{formatPct(ownership?.currentPercentage)}
                </span>
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <Wallet size={13} />
                Tokens pendentes
              </div>
              <div className={styles.metricValue}>{formatToken(ownership?.pendingTokenBalance)}</div>
              <div className={styles.metricSub}>aguardando confirmação</div>
            </div>
          </section>

          {/* Wallet addresses */}
          {wallets.length > 0 && (
            <>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionLabelTitle}>Carteiras vinculadas</span>
              </div>
              <WalletAddressCards wallets={wallets} />
            </>
          )}

          {!dashboard && wallets.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Carteira não encontrada</p>
              <p className={styles.emptyDesc}>Nenhuma wallet vinculada ao usuário autenticado.</p>
            </div>
          )}
        </>
      )}
    </FmzConnectedPageShell>
  );
}
