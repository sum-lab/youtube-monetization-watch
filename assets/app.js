(function () {
  const data = window.MONETIZATION_REPORT_DATA || { summary: {}, channels: [] };
  const channels = data.channels || [];
  const labels = (data.summary && data.summary.labels) || {};
  const semiannualDashboard = data.semiannualDashboard || null;
  const issueBaseUrl = "https://github.com/sum-lab/youtube-monetization-watch/issues/new";

  const resultWeight = {
    likely_not_monetized: 0,
    inconclusive: 1,
    failed: 2,
    likely_monetized: 3,
  };

  const elements = {
    generatedAt: document.getElementById("generatedAt"),
    summaryGrid: document.getElementById("summaryGrid"),
    searchInput: document.getElementById("searchInput"),
    resultFilter: document.getElementById("resultFilter"),
    confidenceFilter: document.getElementById("confidenceFilter"),
    sortSelect: document.getElementById("sortSelect"),
    visibleCount: document.getElementById("visibleCount"),
    channelRows: document.getElementById("channelRows"),
    globalFeedbackLink: document.getElementById("globalFeedbackLink"),
    feedbackPanelLink: document.getElementById("feedbackPanelLink"),
    sourceMetaTotal: document.getElementById("sourceMetaTotal"),
    sourceMetaDate: document.getElementById("sourceMetaDate"),
    periodDashboard: document.getElementById("periodDashboard"),
    dashboardVerdict: document.getElementById("dashboardVerdict"),
    dashboardKpis: document.getElementById("dashboardKpis"),
    prevalenceChart: document.getElementById("prevalenceChart"),
    dashboardRows: document.getElementById("dashboardRows"),
    dashboardNote: document.getElementById("dashboardNote"),
  };

  function issueUrl(channel) {
    const params = new URLSearchParams();
    params.set("labels", "情報提供,要確認");
    if (channel) {
      params.set("title", `情報提供: ${channel.label}`);
      params.set(
        "body",
        [
          "## 対象チャンネル",
          `- チャンネル名: ${channel.label}`,
          `- チャンネルID: ${channel.channelId}`,
          `- URL: ${channel.url}`,
          `- 現在の判定: ${channel.resultLabel}`,
          `- 信頼度: ${channel.confidenceLabel}`,
          "",
          "## 情報の種類",
          "- [ ] 収益化停止ではないと思う",
          "- [ ] 収益化停止の可能性がある",
          "- [ ] 未収益化だと思う",
          "- [ ] 収益化が復旧した",
          "- [ ] 掲載除外・表記修正の依頼",
          "- [ ] その他",
          "",
          "## 根拠",
          "- 根拠URL:",
          "- 確認日時:",
          "- 説明:",
          "",
          "## 連絡先",
          "- 任意:",
        ].join("\n")
      );
    } else {
      params.set("title", "収益化停止DBへの情報提供");
      params.set(
        "body",
        [
          "## 対象チャンネル",
          "- チャンネル名:",
          "- チャンネルIDまたはURL:",
          "",
          "## 情報の種類",
          "- [ ] 収益化停止ではないと思う",
          "- [ ] 収益化停止の可能性がある",
          "- [ ] 未収益化だと思う",
          "- [ ] 収益化が復旧した",
          "- [ ] 掲載除外・表記修正の依頼",
          "- [ ] その他",
          "",
          "## 根拠",
          "- 根拠URL:",
          "- 確認日時:",
          "- 説明:",
          "",
          "## 連絡先",
          "- 任意:",
        ].join("\n")
      );
    }
    return `${issueBaseUrl}?${params.toString()}`;
  }

  function formatDate(value) {
    if (!value) return "更新日時: -";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return `更新日時: ${value}`;
    return `更新日時: ${date.toLocaleString("ja-JP")}`;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("ja-JP");
  }

  function formatDays(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value) === 0 ? "今日" : `${formatNumber(value)}日前`;
  }

  function formatRate(value) {
    if (value === null || value === undefined || value === "") return "-";
    return `${Math.round(Number(value) * 100)}%`;
  }

  function formatPercent(value, digits = 1) {
    if (value === null || value === undefined || value === "") return "-";
    return `${(Number(value) * 100).toFixed(digits)}%`;
  }

  function formatSignedPoints(value) {
    if (value === null || value === undefined || value === "") return "-";
    const points = Number(value) * 100;
    const sign = points > 0 ? "+" : "";
    return `${sign}${points.toFixed(1)}ポイント`;
  }

  function formatRelative(value) {
    if (value === null || value === undefined || value === "") return "-";
    const pct = Number(value) * 100;
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  }

  function formatPeriod(value) {
    const match = String(value || "").match(/^(\d{4})H([12])$/);
    if (!match) return String(value || "-");
    return `${match[1]}年${match[2] === "1" ? "上半期" : "下半期"}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSummary() {
    const items = [
      ["total", "判定対象", data.summary.total],
      ["likely_not_monetized", labels.likely_not_monetized, data.summary.counts?.likely_not_monetized],
      ["inconclusive", labels.inconclusive, data.summary.counts?.inconclusive],
      ["likely_monetized", labels.likely_monetized, data.summary.counts?.likely_monetized],
    ];
    elements.summaryGrid.innerHTML = items
      .map(
        ([key, label, count]) => `
          <article class="summary-card summary-card-${escapeHtml(key)}">
            <span>${escapeHtml(label || key)}</span>
            <strong>${formatNumber(count)}</strong>
          </article>
        `
      )
      .join("");
  }

  function avatarMarkup(channel) {
    if (channel.iconUrl) {
      return `<img class="avatar" src="${escapeHtml(channel.iconUrl)}" loading="lazy" referrerpolicy="no-referrer" alt="">`;
    }
    return `<div class="avatar avatar-fallback" aria-hidden="true">${escapeHtml((channel.label || "?").slice(0, 1))}</div>`;
  }

  function rowMarkup(channel) {
    return `
      <tr>
        <td>
          <div class="channel-cell">
            ${avatarMarkup(channel)}
            <div>
              <a class="channel-title" href="${escapeHtml(channel.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(channel.label)}</a>
              <div class="channel-id">${escapeHtml(channel.channelId)}</div>
            </div>
          </div>
        </td>
        <td><span class="pill ${escapeHtml(channel.result)}">${escapeHtml(channel.resultLabel)}</span></td>
        <td>${escapeHtml(channel.confidenceLabel)}</td>
        <td>${formatNumber(channel.subscribers)}</td>
        <td>${formatDays(channel.latestUploadDays)}</td>
        <td>${formatRate(channel.positiveRate)}</td>
        <td>${escapeHtml(channel.discoverySource || "-")}</td>
        <td><a class="report-link report-link-small" href="${escapeHtml(issueUrl(channel))}" target="_blank" rel="noopener noreferrer">情報提供</a></td>
      </tr>
    `;
  }

  function filteredChannels() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const result = elements.resultFilter.value;
    const confidence = elements.confidenceFilter.value;

    return channels.filter((channel) => {
      if (result !== "all" && channel.result !== result) return false;
      if (confidence !== "all" && channel.confidence !== confidence) return false;
      if (!query) return true;
      const haystack = [
        channel.label,
        channel.channelId,
        channel.discoverySource,
        channel.resultLabel,
        channel.confidenceLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function sortChannels(items) {
    const sort = elements.sortSelect.value;
    return [...items].sort((a, b) => {
      if (sort === "subscribers") return (b.subscribers || 0) - (a.subscribers || 0);
      if (sort === "latest") return (a.latestUploadDays ?? 99999) - (b.latestUploadDays ?? 99999);
      if (sort === "name") return String(a.label).localeCompare(String(b.label), "ja");
      return (resultWeight[a.result] ?? 9) - (resultWeight[b.result] ?? 9) || (b.subscribers || 0) - (a.subscribers || 0);
    });
  }

  function renderRows() {
    const visible = sortChannels(filteredChannels());
    elements.visibleCount.textContent = `${formatNumber(visible.length)} / ${formatNumber(channels.length)} 件`;
    elements.channelRows.innerHTML = visible.map(rowMarkup).join("");
  }

  function initSourceMeta() {
    if (elements.sourceMetaTotal) {
      elements.sourceMetaTotal.textContent = `${formatNumber(data.summary.total)}チャンネル`;
    }
    if (elements.sourceMetaDate) {
      elements.sourceMetaDate.textContent = String(data.summary.sourceReportAt || "").slice(0, 10) || "-";
    }
  }

  function averageRate(rows) {
    const values = rows.map((row) => Number(row.currentLikelyNotRateAmongChecked || 0)).filter((value) => Number.isFinite(value));
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function highestRateRow(rows) {
    return rows.reduce((best, row) => {
      if (!best) return row;
      return Number(row.currentLikelyNotRateAmongChecked || 0) > Number(best.currentLikelyNotRateAmongChecked || 0) ? row : best;
    }, null);
  }

  function formatPeriodShort(value) {
    const match = String(value || "").match(/^(\d{4})H([12])$/);
    if (!match) return String(value || "-");
    return `${match[1]}${match[2] === "1" ? "上" : "下"}`;
  }

  function renderDashboardVerdict() {
    if (!elements.dashboardVerdict || !semiannualDashboard) return;
    const rows = semiannualDashboard.prevalence || [];
    const latest = rows[rows.length - 1] || {};
    const pastRows = rows.slice(0, -1);
    const pastAverage = averageRate(pastRows);
    const deltaFromPast = pastAverage === null ? null : Number(latest.currentLikelyNotRateAmongChecked || 0) - pastAverage;
    const highest = highestRateRow(rows) || {};
    const previous = pastRows[pastRows.length - 1] || {};
    elements.dashboardVerdict.innerHTML = `
      <div class="verdict-main">
        <span>結論</span>
        <strong>増加とは言い切れません</strong>
      </div>
      <p>
        ${escapeHtml(formatPeriod(latest.period))}は${escapeHtml(formatPercent(latest.currentLikelyNotRateAmongChecked))}です。
        ${escapeHtml(formatPeriod(previous.period))}より${escapeHtml(formatSignedPoints(latest.previousRateDeltaPoints))}ですが、
        2023年から2025年までの平均${escapeHtml(formatPercent(pastAverage))}より${escapeHtml(formatSignedPoints(deltaFromPast))}で、
        過去最高の${escapeHtml(formatPercent(highest.currentLikelyNotRateAmongChecked))}を下回っています。
      </p>
    `;
  }

  function renderDashboardKpis() {
    if (!elements.dashboardKpis || !semiannualDashboard) return;
    const rows = semiannualDashboard.prevalence || [];
    const latest = rows[rows.length - 1] || {};
    const pastRows = rows.slice(0, -1);
    const previous = pastRows[pastRows.length - 1] || {};
    const pastAverage = averageRate(pastRows);
    const deltaFromPast = pastAverage === null ? null : Number(latest.currentLikelyNotRateAmongChecked || 0) - pastAverage;
    const highest = highestRateRow(rows) || {};
    const cards = [
      {
        label: formatPeriod(latest.period),
        value: formatPercent(latest.currentLikelyNotRateAmongChecked),
        detail: "収益化停止・未収益化率",
        tone: "blue",
      },
      {
        label: "過去平均との差",
        value: formatSignedPoints(deltaFromPast),
        detail: `2023-2025平均 ${formatPercent(pastAverage)}`,
        tone: Number(deltaFromPast || 0) > 0 ? "red" : "gray",
      },
      {
        label: "直前との差",
        value: formatSignedPoints(latest.previousRateDeltaPoints),
        detail: `${formatPeriod(previous.period)}比`,
        tone: Number(latest.previousRateDeltaPoints || 0) > 0 ? "red" : "gray",
      },
      {
        label: "過去最高",
        value: formatPercent(highest.currentLikelyNotRateAmongChecked),
        detail: formatPeriod(highest.period),
        tone: "black",
      },
    ];
    elements.dashboardKpis.innerHTML = cards
      .map(
        (card) => `
          <article class="dashboard-kpi dashboard-kpi-${escapeHtml(card.tone)}">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <em>${escapeHtml(card.detail)}</em>
          </article>
        `
      )
      .join("");
  }

  function renderPrevalenceChart() {
    if (!elements.prevalenceChart || !semiannualDashboard) return;
    const rows = semiannualDashboard.prevalence || [];
    if (!rows.length) return;
    const pastAverage = averageRate(rows.slice(0, -1));
    const width = 760;
    const height = 320;
    const margin = { top: 24, right: 28, bottom: 58, left: 58 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const maxRate = Math.max(0.25, ...rows.map((row) => Number(row.currentLikelyNotRateAmongChecked || 0))) * 1.05;
    const x = (index) => margin.left + (rows.length === 1 ? chartWidth / 2 : (chartWidth * index) / (rows.length - 1));
    const y = (rate) => margin.top + chartHeight - (Number(rate || 0) / maxRate) * chartHeight;
    const points = rows.map((row, index) => `${x(index).toFixed(1)},${y(row.currentLikelyNotRateAmongChecked).toFixed(1)}`).join(" ");
    const ticks = [0, 0.05, 0.1, 0.15, 0.2];
    const grid = ticks
      .map((tick) => {
        const ty = y(tick);
        return `
          <line class="dashboard-chart-grid" x1="${margin.left}" y1="${ty.toFixed(1)}" x2="${width - margin.right}" y2="${ty.toFixed(1)}"></line>
          <text class="dashboard-chart-y" x="${margin.left - 10}" y="${(ty + 4).toFixed(1)}" text-anchor="end">${escapeHtml(formatPercent(tick, 0))}</text>
        `;
      })
      .join("");
    const averageLine =
      pastAverage === null
        ? ""
        : `<line class="dashboard-chart-average" x1="${margin.left}" y1="${y(pastAverage).toFixed(1)}" x2="${width - margin.right}" y2="${y(pastAverage).toFixed(1)}"></line>`;
    const markers = rows
      .map((row, index) => {
        const cx = x(index);
        const cy = y(row.currentLikelyNotRateAmongChecked);
        const isLatest = index === rows.length - 1;
        return `
          <g class="${isLatest ? "dashboard-point-current" : "dashboard-point"}">
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${isLatest ? 6 : 4}"></circle>
            <text x="${cx.toFixed(1)}" y="${(cy - 12).toFixed(1)}" text-anchor="middle">${escapeHtml(formatPercent(row.currentLikelyNotRateAmongChecked))}</text>
            <text class="dashboard-chart-x" x="${cx.toFixed(1)}" y="${height - 24}" text-anchor="middle">${escapeHtml(formatPeriodShort(row.period))}</text>
          </g>
        `;
      })
      .join("");
    elements.prevalenceChart.innerHTML = `
      <svg class="dashboard-line-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="半期別の収益化停止・未収益化率">
        <title>半期別の収益化停止・未収益化率</title>
        ${grid}
        ${averageLine}
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
        <polyline class="dashboard-line-series" points="${points}"></polyline>
        ${markers}
      </svg>
      <div class="dashboard-chart-legend">
        <span><i class="legend-line-current"></i>半期別の率</span>
        <span><i class="legend-line-average"></i>2023-2025平均</span>
      </div>
    `;
  }

  function renderDashboardTable() {
    if (!elements.dashboardRows || !semiannualDashboard) return;
    elements.dashboardRows.innerHTML = (semiannualDashboard.prevalence || [])
      .map((row) => {
        return `
          <tr>
            <td>${escapeHtml(formatPeriod(row.period))}</td>
            <td>${escapeHtml(formatPercent(row.currentLikelyNotRateAmongChecked))}</td>
            <td>${escapeHtml(formatSignedPoints(row.previousRateDeltaPoints))}</td>
            <td>${formatNumber(row.activeChannelsWithAdResult)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderDashboardNote() {
    if (!elements.dashboardNote || !semiannualDashboard) return;
    elements.dashboardNote.textContent = [
      `作成基準日: ${semiannualDashboard.asOf || "-"}`,
      "公開動画から機械的に推定した暫定値です。",
      "2026年上半期は期間途中の速報値です。",
    ].join(" / ");
  }

  function renderPeriodDashboard() {
    if (!elements.periodDashboard) return;
    if (!semiannualDashboard) {
      elements.periodDashboard.hidden = true;
      return;
    }
    renderDashboardKpis();
    renderDashboardVerdict();
    renderPrevalenceChart();
    renderDashboardTable();
    renderDashboardNote();
  }

  function initFeedbackLinks() {
    const url = issueUrl();
    if (elements.globalFeedbackLink) elements.globalFeedbackLink.href = url;
    if (elements.feedbackPanelLink) elements.feedbackPanelLink.href = url;
  }

  function init() {
    elements.generatedAt.textContent = formatDate(data.summary.generatedAt);
    initSourceMeta();
    initFeedbackLinks();
    renderPeriodDashboard();
    renderSummary();
    renderRows();
    [elements.searchInput, elements.resultFilter, elements.confidenceFilter, elements.sortSelect].forEach((element) => {
      element.addEventListener("input", renderRows);
      element.addEventListener("change", renderRows);
    });
  }

  init();
})();
