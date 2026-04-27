(function () {
  const data = window.MONETIZATION_REPORT_DATA || { summary: {}, channels: [] };
  const channels = data.channels || [];
  const labels = (data.summary && data.summary.labels) || {};
  const semiannualDashboard = data.semiannualDashboard || null;
  const issueBaseUrl = "https://github.com/sum-lab/youtube-monetization-watch/issues/new";
  const listPageSize = 100;

  let activeResult = "likely_not_monetized";
  let visibleLimit = listPageSize;

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
    confidenceFilter: document.getElementById("confidenceFilter"),
    personaFilter: document.getElementById("personaFilter"),
    sortSelect: document.getElementById("sortSelect"),
    visibleCount: document.getElementById("visibleCount"),
    channelRows: document.getElementById("channelRows"),
    resultTabs: document.getElementById("resultTabs"),
    loadMoreButton: document.getElementById("loadMoreButton"),
    globalFeedbackLink: document.getElementById("globalFeedbackLink"),
    feedbackPanelLink: document.getElementById("feedbackPanelLink"),
    sourceMetaTotal: document.getElementById("sourceMetaTotal"),
    sourceMetaDate: document.getElementById("sourceMetaDate"),
    periodDashboard: document.getElementById("periodDashboard"),
    dashboardVerdict: document.getElementById("dashboardVerdict"),
    dashboardKpis: document.getElementById("dashboardKpis"),
    prevalenceChart: document.getElementById("prevalenceChart"),
    dashboardRows: document.getElementById("dashboardRows"),
    personaPrevalenceSummary: document.getElementById("personaPrevalenceSummary"),
    personaPrevalenceChart: document.getElementById("personaPrevalenceChart"),
    personaPrevalenceRows: document.getElementById("personaPrevalenceRows"),
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

  function resultTabItems() {
    return [
      ["likely_not_monetized", "収益化停止・未収益化"],
      ["inconclusive", labels.inconclusive || "判定保留"],
      ["failed", labels.failed || "取得失敗"],
      ["likely_monetized", "収益化中"],
      ["all", "すべて"],
    ];
  }

  function resultCount(value) {
    return channels.reduce((count, channel) => {
      if (value !== "all" && channel.result !== value) return count;
      return count + (matchesToolbarFilters(channel) ? 1 : 0);
    }, 0);
  }

  function renderResultTabs() {
    if (!elements.resultTabs) return;
    elements.resultTabs.innerHTML = resultTabItems()
      .map(([value, label]) => {
        const active = value === activeResult;
        return `
          <button class="result-tab ${active ? "is-active" : ""}" type="button" data-result="${escapeHtml(value)}" aria-pressed="${active ? "true" : "false"}">
            <span>${escapeHtml(label)}</span>
            <strong>${formatNumber(resultCount(value))}</strong>
          </button>
        `;
      })
      .join("");
  }

  function avatarMarkup(channel) {
    if (channel.iconUrl) {
      return `<img class="avatar" src="${escapeHtml(channel.iconUrl)}" loading="lazy" referrerpolicy="no-referrer" alt="">`;
    }
    return `<div class="avatar avatar-fallback" aria-hidden="true">${escapeHtml((channel.label || "?").slice(0, 1))}</div>`;
  }

  const personaShortLabels = {
    personal: "属人",
    non_personal: "非属人",
    unknown: "判定不能",
  };

  const personaConfidenceLabels = {
    high: "高",
    medium: "中",
    low: "低",
  };

  function personaLabel(channel) {
    return personaShortLabels[channel.persona || "unknown"] || "判定不能";
  }

  function personaCellMarkup(channel) {
    const persona = channel.persona || "unknown";
    const confidence = personaConfidenceLabels[channel.personaConfidence] || channel.personaConfidence || "-";
    return `<span class="persona-pill persona-pill-${escapeHtml(persona)}" title="分類信頼度: ${escapeHtml(confidence)}">${escapeHtml(personaLabel(channel))}</span>`;
  }

  function channelHaystack(channel) {
    return [
      channel.label,
      channel.channelId,
      channel.discoverySource,
      channel.resultLabel,
      channel.confidenceLabel,
      personaLabel(channel),
      channel.persona,
      channel.personaConfidence,
    ]
      .join(" ")
      .toLowerCase();
  }

  function matchesToolbarFilters(channel) {
    const query = elements.searchInput.value.trim().toLowerCase();
    const confidence = elements.confidenceFilter.value;
    const persona = elements.personaFilter ? elements.personaFilter.value : "all";
    if (confidence !== "all" && channel.confidence !== confidence) return false;
    if (persona !== "all" && (channel.persona || "unknown") !== persona) return false;
    return !query || channelHaystack(channel).includes(query);
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
        <td>${personaCellMarkup(channel)}</td>
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
    return channels.filter((channel) => {
      if (activeResult !== "all" && channel.result !== activeResult) return false;
      return matchesToolbarFilters(channel);
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
    const rows = visible.slice(0, visibleLimit);
    elements.visibleCount.textContent = `${formatNumber(rows.length)} / ${formatNumber(visible.length)} 件表示`;
    elements.channelRows.innerHTML = rows.length
      ? rows.map(rowMarkup).join("")
      : `<tr><td class="no-results" colspan="9">該当するチャンネルはありません</td></tr>`;
    if (elements.loadMoreButton) {
      const remaining = Math.max(0, visible.length - rows.length);
      elements.loadMoreButton.hidden = remaining === 0;
      elements.loadMoreButton.textContent = `さらに表示（残り${formatNumber(remaining)}件）`;
    }
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

  function formatPeriodTickParts(value) {
    const match = String(value || "").match(/^(\d{4})H([12])$/);
    if (!match) return { year: String(value || "-"), half: "" };
    return { year: `${match[1]}年`, half: match[2] === "1" ? "上半期" : "下半期" };
  }

  function formatAbsPoints(value) {
    if (value === null || value === undefined || value === "") return "-";
    return `${Math.abs(Number(value) * 100).toFixed(1)}ポイント`;
  }

  const personaComparisonItems = [
    { key: "personal", label: "属人" },
    { key: "non_personal", label: "非属人" },
  ];

  function personaSegment(row, key) {
    return (row && row.segments && row.segments[key]) || {};
  }

  function weightedPersonaRate(rows, key) {
    const totals = rows.reduce(
      (acc, row) => {
        const segment = personaSegment(row, key);
        acc.numerator += Number(segment.currentLikelyNotActiveChannels || 0);
        acc.denominator += Number(segment.activeChannelsWithAdResult || 0);
        return acc;
      },
      { numerator: 0, denominator: 0 }
    );
    return totals.denominator > 0 ? totals.numerator / totals.denominator : null;
  }

  function personaRate(segment) {
    return segment.currentLikelyNotRateAmongChecked === null || segment.currentLikelyNotRateAmongChecked === undefined
      ? null
      : Number(segment.currentLikelyNotRateAmongChecked);
  }

  function personaFraction(segment) {
    return `${formatNumber(segment.currentLikelyNotActiveChannels || 0)} / ${formatNumber(segment.activeChannelsWithAdResult || 0)}`;
  }

  function personaRateWithFraction(segment) {
    const rate = personaRate(segment);
    return rate === null ? "-" : `${formatPercent(rate)}（${personaFraction(segment)}）`;
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
    const averageDirection = Number(deltaFromPast || 0) > 0 ? "上回る" : Number(deltaFromPast || 0) < 0 ? "下回る" : "同水準";
    const averagePhrase =
      Number(deltaFromPast || 0) === 0
        ? "と同じ"
        : `より${formatAbsPoints(deltaFromPast)}${Number(deltaFromPast || 0) > 0 ? "高く" : "低く"}`;
    const previousPhrase =
      Number(latest.previousRateDeltaPoints || 0) === 0
        ? "同水準"
        : `${formatAbsPoints(latest.previousRateDeltaPoints)}${Number(latest.previousRateDeltaPoints || 0) > 0 ? "上昇" : "低下"}`;
    elements.dashboardVerdict.innerHTML = `
      <div class="verdict-main">
        <span>比較結果</span>
        <strong>${escapeHtml(formatPeriod(latest.period))}は過去平均を${escapeHtml(averageDirection)}</strong>
      </div>
      <p>
        現在値は${escapeHtml(formatPercent(latest.currentLikelyNotRateAmongChecked))}。
        2023〜2025年平均${escapeHtml(formatPercent(pastAverage))}${escapeHtml(averagePhrase)}、
        過去最高${escapeHtml(formatPercent(highest.currentLikelyNotRateAmongChecked))}（${escapeHtml(formatPeriod(highest.period))}）を下回ります。
        直前の${escapeHtml(formatPeriod(previous.period))}からは${escapeHtml(previousPhrase)}。
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
        label: "現在値",
        value: formatPercent(latest.currentLikelyNotRateAmongChecked),
        detail: formatPeriod(latest.period),
        tone: "blue",
      },
      {
        label: "比較基準",
        value: formatPercent(pastAverage),
        detail: "2023〜2025年平均",
        tone: "gray",
      },
      {
        label: "平均との差",
        value: formatSignedPoints(deltaFromPast),
        detail: "現在値 - 比較基準",
        tone: "gray",
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
    const width = 900;
    const height = 390;
    const margin = { top: 58, right: 162, bottom: 86, left: 76 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const observedMax = Math.max(...rows.map((row) => Number(row.currentLikelyNotRateAmongChecked || 0)));
    const maxRate = Math.max(0.25, Math.ceil(observedMax * 20) / 20);
    const x = (index) => margin.left + (rows.length === 1 ? chartWidth / 2 : (chartWidth * index) / (rows.length - 1));
    const y = (rate) => margin.top + chartHeight - (Number(rate || 0) / maxRate) * chartHeight;
    const points = rows.map((row, index) => `${x(index).toFixed(1)},${y(row.currentLikelyNotRateAmongChecked).toFixed(1)}`).join(" ");
    const tickCount = Math.round(maxRate / 0.05);
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index * 0.05);
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
        : `
          <line class="dashboard-chart-average" x1="${margin.left}" y1="${y(pastAverage).toFixed(1)}" x2="${width - margin.right}" y2="${y(pastAverage).toFixed(1)}"></line>
          <text class="dashboard-average-label" x="${width - margin.right + 20}" y="${(y(pastAverage) - 6).toFixed(1)}">2023〜2025年平均</text>
          <text class="dashboard-average-label dashboard-average-value" x="${width - margin.right + 20}" y="${(y(pastAverage) + 10).toFixed(1)}">${escapeHtml(formatPercent(pastAverage))}</text>
        `;
    const markers = rows
      .map((row, index) => {
        const cx = x(index);
        const cy = y(row.currentLikelyNotRateAmongChecked);
        const isLatest = index === rows.length - 1;
        const parts = formatPeriodTickParts(row.period);
        return `
          <g class="${isLatest ? "dashboard-point-current" : "dashboard-point"}">
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${isLatest ? 6 : 4}"></circle>
            <text x="${cx.toFixed(1)}" y="${(cy - 12).toFixed(1)}" text-anchor="middle">${escapeHtml(formatPercent(row.currentLikelyNotRateAmongChecked))}</text>
            <text class="dashboard-chart-x" x="${cx.toFixed(1)}" y="${height - 54}" text-anchor="middle">
              <tspan x="${cx.toFixed(1)}">${escapeHtml(parts.year)}</tspan>
              <tspan x="${cx.toFixed(1)}" dy="15">${escapeHtml(parts.half)}</tspan>
            </text>
          </g>
        `;
      })
      .join("");
    elements.prevalenceChart.innerHTML = `
      <svg class="dashboard-line-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="半期別の収益化停止・未収益化率">
        <title>半期別の収益化停止・未収益化率</title>
        <text class="dashboard-chart-axis-title" x="${margin.left}" y="22">収益化停止・未収益化率（%）</text>
        ${grid}
        ${averageLine}
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
        <polyline class="dashboard-line-series" points="${points}"></polyline>
        ${markers}
        <text class="dashboard-chart-axis-title" x="${(margin.left + chartWidth / 2).toFixed(1)}" y="${height - 10}" text-anchor="middle">投稿があった時期（半期）</text>
      </svg>
    `;
  }

  function renderPersonaPrevalenceSummary() {
    if (!elements.personaPrevalenceSummary || !semiannualDashboard) return;
    const rows = semiannualDashboard.personaPrevalence || [];
    if (!rows.length) {
      elements.personaPrevalenceSummary.hidden = true;
      return;
    }
    const latest = rows[rows.length - 1] || {};
    const pastRows = rows.slice(0, -1);
    const personal = personaSegment(latest, "personal");
    const nonPersonal = personaSegment(latest, "non_personal");
    const personalPastRate = weightedPersonaRate(pastRows, "personal");
    const nonPersonalPastRate = weightedPersonaRate(pastRows, "non_personal");
    const personalDelta = personaRate(personal) === null || personalPastRate === null ? null : personaRate(personal) - personalPastRate;
    const nonPersonalDelta =
      personaRate(nonPersonal) === null || nonPersonalPastRate === null ? null : personaRate(nonPersonal) - nonPersonalPastRate;
    const gap =
      personaRate(nonPersonal) === null || personaRate(personal) === null
        ? null
        : personaRate(nonPersonal) - personaRate(personal);
    const cards = [
      {
        key: "personal",
        label: "属人",
        value: formatPercent(personaRate(personal)),
        fraction: personaFraction(personal),
        delta: formatSignedPoints(personalDelta),
      },
      {
        key: "non_personal",
        label: "非属人",
        value: formatPercent(personaRate(nonPersonal)),
        fraction: personaFraction(nonPersonal),
        delta: formatSignedPoints(nonPersonalDelta),
      },
    ];
    elements.personaPrevalenceSummary.hidden = false;
    elements.personaPrevalenceSummary.innerHTML = `
      <div class="persona-prevalence-cards">
        ${cards
          .map(
            (card) => `
              <article class="persona-prevalence-card persona-prevalence-card-${escapeHtml(card.key)}">
                <span>${escapeHtml(card.label)}</span>
                <strong>${escapeHtml(card.value)}</strong>
                <em>${escapeHtml(formatPeriod(latest.period))} / ${escapeHtml(card.fraction)}</em>
                <small>2023〜2025年平均との差 ${escapeHtml(card.delta)}</small>
              </article>
            `
          )
          .join("")}
      </div>
      <p>
        ${escapeHtml(formatPeriod(latest.period))}は、非属人が属人より${escapeHtml(formatAbsPoints(gap))}高い状態です。
        全体の変化を見るための補助線として、チャンネル種別別にも確認しています。
      </p>
    `;
  }

  function renderPersonaPrevalenceChart() {
    if (!elements.personaPrevalenceChart || !semiannualDashboard) return;
    const rows = semiannualDashboard.personaPrevalence || [];
    if (!rows.length) return;
    const width = 900;
    const height = 390;
    const margin = { top: 58, right: 140, bottom: 86, left: 76 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const values = rows.flatMap((row) =>
      personaComparisonItems.map((item) => personaRate(personaSegment(row, item.key))).filter((value) => value !== null)
    );
    const observedMax = values.length ? Math.max(...values) : 0;
    const maxRate = Math.max(0.25, Math.ceil(observedMax * 20) / 20);
    const x = (index) => margin.left + (rows.length === 1 ? chartWidth / 2 : (chartWidth * index) / (rows.length - 1));
    const y = (rate) => margin.top + chartHeight - (Number(rate || 0) / maxRate) * chartHeight;
    const tickCount = Math.round(maxRate / 0.05);
    const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index * 0.05);
    const grid = ticks
      .map((tick) => {
        const ty = y(tick);
        return `
          <line class="dashboard-chart-grid" x1="${margin.left}" y1="${ty.toFixed(1)}" x2="${width - margin.right}" y2="${ty.toFixed(1)}"></line>
          <text class="dashboard-chart-y" x="${margin.left - 10}" y="${(ty + 4).toFixed(1)}" text-anchor="end">${escapeHtml(formatPercent(tick, 0))}</text>
        `;
      })
      .join("");
    const series = personaComparisonItems
      .map((item) => {
        const points = rows
          .map((row, index) => `${x(index).toFixed(1)},${y(personaRate(personaSegment(row, item.key))).toFixed(1)}`)
          .join(" ");
        const dots = rows
          .map((row, index) => {
            const segment = personaSegment(row, item.key);
            const cx = x(index);
            const cy = y(personaRate(segment));
            return `
              <circle class="persona-dot persona-dot-${escapeHtml(item.key)}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4">
                <title>${escapeHtml(item.label)} ${escapeHtml(formatPeriod(row.period))}: ${escapeHtml(personaRateWithFraction(segment))}</title>
              </circle>
            `;
          })
          .join("");
        return `
          <polyline class="persona-line persona-line-${escapeHtml(item.key)}" points="${points}"></polyline>
          ${dots}
        `;
      })
      .join("");
    const latest = rows[rows.length - 1] || {};
    const latestLabels = personaComparisonItems
      .map((item, index) => {
        const segment = personaSegment(latest, item.key);
        const rate = personaRate(segment);
        return `
          <text class="persona-chart-label persona-chart-label-${escapeHtml(item.key)}" x="${width - margin.right + 18}" y="${(y(rate) + 4 + index * 4).toFixed(1)}">
            ${escapeHtml(item.label)} ${escapeHtml(formatPercent(rate))}
          </text>
        `;
      })
      .join("");
    const legend = personaComparisonItems
      .map(
        (item, index) => `
          <g transform="translate(${margin.left + index * 94}, 34)">
            <line class="persona-line persona-line-${escapeHtml(item.key)}" x1="0" y1="0" x2="26" y2="0"></line>
            <text class="dashboard-chart-axis-title" x="34" y="4">${escapeHtml(item.label)}</text>
          </g>
        `
      )
      .join("");
    const markers = rows
      .map((row, index) => {
        const parts = formatPeriodTickParts(row.period);
        const cx = x(index);
        return `
          <text class="dashboard-chart-x" x="${cx.toFixed(1)}" y="${height - 54}" text-anchor="middle">
            <tspan x="${cx.toFixed(1)}">${escapeHtml(parts.year)}</tspan>
            <tspan x="${cx.toFixed(1)}" dy="15">${escapeHtml(parts.half)}</tspan>
          </text>
        `;
      })
      .join("");
    elements.personaPrevalenceChart.innerHTML = `
      <svg class="dashboard-line-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="属人と非属人の半期別推移">
        <title>属人と非属人の半期別推移</title>
        <text class="dashboard-chart-axis-title" x="${margin.left}" y="22">収益化停止・未収益化率（%）</text>
        ${legend}
        ${grid}
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
        <line class="dashboard-chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
        ${series}
        ${latestLabels}
        ${markers}
        <text class="dashboard-chart-axis-title" x="${(margin.left + chartWidth / 2).toFixed(1)}" y="${height - 10}" text-anchor="middle">投稿があった時期（半期）</text>
      </svg>
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

  function renderPersonaPrevalenceTable() {
    if (!elements.personaPrevalenceRows || !semiannualDashboard) return;
    elements.personaPrevalenceRows.innerHTML = (semiannualDashboard.personaPrevalence || [])
      .map((row) => {
        const personal = personaSegment(row, "personal");
        const nonPersonal = personaSegment(row, "non_personal");
        const gap =
          personaRate(nonPersonal) === null || personaRate(personal) === null
            ? null
            : personaRate(nonPersonal) - personaRate(personal);
        return `
          <tr>
            <td>${escapeHtml(formatPeriod(row.period))}</td>
            <td>${escapeHtml(personaRateWithFraction(personal))}</td>
            <td>${escapeHtml(personaRateWithFraction(nonPersonal))}</td>
            <td>${escapeHtml(formatSignedPoints(gap))}</td>
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
    renderPersonaPrevalenceSummary();
    renderPersonaPrevalenceChart();
    renderPersonaPrevalenceTable();
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
    renderResultTabs();
    renderRows();
    [elements.searchInput, elements.confidenceFilter, elements.personaFilter, elements.sortSelect].forEach((element) => {
      if (!element) return;
      element.addEventListener("input", () => {
        visibleLimit = listPageSize;
        renderResultTabs();
        renderRows();
      });
      element.addEventListener("change", () => {
        visibleLimit = listPageSize;
        renderResultTabs();
        renderRows();
      });
    });
    if (elements.resultTabs) {
      elements.resultTabs.addEventListener("click", (event) => {
        const button = event.target && event.target.closest ? event.target.closest("button[data-result]") : null;
        if (!button) return;
        activeResult = button.dataset.result || "likely_not_monetized";
        visibleLimit = listPageSize;
        renderResultTabs();
        renderRows();
      });
    }
    if (elements.loadMoreButton) {
      elements.loadMoreButton.addEventListener("click", () => {
        visibleLimit += listPageSize;
        renderRows();
      });
    }
  }

  init();
})();
