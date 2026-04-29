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
    sourceFilter: document.getElementById("sourceFilter"),
    sortSelect: document.getElementById("sortSelect"),
    visibleCount: document.getElementById("visibleCount"),
    channelRows: document.getElementById("channelRows"),
    resultTabs: document.getElementById("resultTabs"),
    loadMoreButton: document.getElementById("loadMoreButton"),
    personaKpiGrid: document.getElementById("personaKpiGrid"),
    personaStoppedRateChart: document.getElementById("personaStoppedRateChart"),
    personaStackChart: document.getElementById("personaStackChart"),
    personaStackLegend: document.getElementById("personaStackLegend"),
    personaCrossTable: document.getElementById("personaCrossTable"),
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
    inactivityCandidateRows: document.getElementById("inactivityCandidateRows"),
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
    if (value === "all") return channels.length;
    return channels.reduce((count, channel) => count + (channel.result === value ? 1 : 0), 0);
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
    unknown: "不明",
  };

  function personaCellMarkup(channel) {
    const p = channel.persona || "unknown";
    const label = channel.personaDisplayLabel || personaShortLabels[p] || "-";
    return `<span class="persona-pill persona-pill-${escapeHtml(p)}">${escapeHtml(label)}</span>`;
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
    const query = elements.searchInput.value.trim().toLowerCase();
    const confidence = elements.confidenceFilter.value;
    const persona = elements.personaFilter ? elements.personaFilter.value : "all";
    const source = elements.sourceFilter ? elements.sourceFilter.value : "all";

    return channels.filter((channel) => {
      if (activeResult !== "all" && channel.result !== activeResult) return false;
      if (confidence !== "all" && channel.confidence !== confidence) return false;
      if (persona !== "all" && (channel.persona || "unknown") !== persona) return false;
      if (source !== "all" && (channel.discoverySource || "") !== source) return false;
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

  function rateWithWilson(row) {
    const rate = row.currentLikelyNotRateAmongChecked;
    if (rate === null || rate === undefined) return "-";
    if (row.wilson95Low === null || row.wilson95Low === undefined || row.wilson95High === null || row.wilson95High === undefined) {
      return formatPercent(rate);
    }
    return `${formatPercent(rate)}（95%CI ${formatPercent(row.wilson95Low)}〜${formatPercent(row.wilson95High)}）`;
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
        <span>比較</span>
        <strong>${escapeHtml(formatPeriod(latest.period))}の広告が確認できなかった割合は過去平均を${escapeHtml(averageDirection)}</strong>
      </div>
      <p>
        現在値は${escapeHtml(formatPercent(latest.currentLikelyNotRateAmongChecked))}（${formatNumber(latest.currentLikelyNotActiveChannels || 0)} / ${formatNumber(latest.activeChannelsWithAdResult || 0)}）。
        2023〜2025年平均${escapeHtml(formatPercent(pastAverage))}${escapeHtml(averagePhrase)}、
        過去最高${escapeHtml(formatPercent(highest.currentLikelyNotRateAmongChecked))}（${escapeHtml(formatPeriod(highest.period))}）と比較しています。
        直前の${escapeHtml(formatPeriod(previous.period))}からは${escapeHtml(previousPhrase)}。
        これは停止発生日ではなく、現在時点で外部から広告表示を確認した結果です。
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
        label: "広告なし割合",
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
        label: "判定母数",
        value: formatNumber(latest.activeChannelsWithAdResult),
        detail: `非表示 ${formatNumber(latest.currentLikelyNotActiveChannels || 0)}`,
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
      <svg class="dashboard-line-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="半期別の広告が確認できなかった割合">
        <title>半期別の広告が確認できなかった割合</title>
        <text class="dashboard-chart-axis-title" x="${margin.left}" y="22">広告が確認できなかった割合（%）</text>
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
        ${escapeHtml(formatPeriod(latest.period))}の広告が確認できなかった割合は、非属人が属人より${escapeHtml(formatAbsPoints(gap))}高い状態です。
        これは停止発生日ではなく、現在時点で外部から広告表示を確認した結果をチャンネル種別別に見た補助線です。
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
        <text class="dashboard-chart-axis-title" x="${margin.left}" y="22">広告が確認できなかった割合（%）</text>
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
            <td>${escapeHtml(rateWithWilson(row))}</td>
            <td>${escapeHtml(formatSignedPoints(row.previousRateDeltaPoints))}</td>
            <td>${formatNumber(row.currentLikelyNotActiveChannels || 0)} / ${formatNumber(row.activeChannelsWithAdResult || 0)}</td>
            <td>${formatNumber(row.inconclusiveActiveChannels || 0)} / ${formatNumber(row.failedAdResultActiveChannels || 0)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderInactivityCandidateTable() {
    if (!elements.inactivityCandidateRows || !semiannualDashboard) return;
    const threshold = semiannualDashboard.mainThresholdDays || 30;
    const rows = (semiannualDashboard.incidence || []).filter((row) => Number(row.thresholdDays) === Number(threshold));
    elements.inactivityCandidateRows.innerHTML = rows
      .map((row) => {
        const unresolved = [
          row.inconclusiveInactiveCandidates || 0,
          row.failedAdResultInactiveCandidates || 0,
          row.missingAdResultInactiveCandidates || 0,
        ];
        const status =
          row.displayStatus === "display_proxy_rate_with_caution"
            ? "参考率表示可"
            : "内訳のみ";
        return `
          <tr>
            <td>${escapeHtml(formatPeriod(row.period))}</td>
            <td>${formatNumber(row.activeChannelsInEventWindow || 0)}</td>
            <td>${formatNumber(row.inactiveCandidatesAllResults || 0)}<br><small>${escapeHtml(status)}</small></td>
            <td>${formatNumber(row.inactiveCandidatesWithDecisiveAdResult || 0)}<br><small>カバー率 ${escapeHtml(formatPercent(row.candidateDecisiveCoverageRate))}</small></td>
            <td>${formatNumber(row.likelyNotInactiveEvents || 0)}</td>
            <td>${unresolved.map(formatNumber).join(" / ")}</td>
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
      "主率は当該半期に投稿が観測され、現在の確認で広告あり・広告なしのどちらかまで判定できたチャンネルを母数にしています。",
      "YouTube公式の収益化状態・停止日・停止発生日を示すものではありません。",
      "同一チャンネルが複数半期に含まれ、2026年上半期は期間途中の速報値です。",
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
    renderInactivityCandidateTable();
    renderDashboardNote();
  }

  function initFeedbackLinks() {
    const url = issueUrl();
    if (elements.globalFeedbackLink) elements.globalFeedbackLink.href = url;
    if (elements.feedbackPanelLink) elements.feedbackPanelLink.href = url;
  }

  const PERSONA_KEYS = ["personal", "non_personal", "unknown"];
  const RESULT_KEYS = ["likely_monetized", "likely_not_monetized", "inconclusive", "failed"];
  const RESULT_SHORT = {
    likely_monetized: "収益化中",
    likely_not_monetized: "停止/未収益化",
    inconclusive: "判定保留",
    failed: "取得失敗",
  };

  function selectPersonaFilter(value) {
    if (!elements.personaFilter) return;
    elements.personaFilter.value = value;
    renderRows();
    if (elements.personaFilter.scrollIntoView) {
      elements.personaFilter.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function renderPersonaKpis(counts, cross, labels) {
    if (!elements.personaKpiGrid) return;
    const total = PERSONA_KEYS.reduce((s, k) => s + (counts[k] || 0), 0) || 1;
    const html = PERSONA_KEYS.map((key) => {
      const count = counts[key] || 0;
      const stopped = (cross[key] || {}).likely_not_monetized || 0;
      const monetized = (cross[key] || {}).likely_monetized || 0;
      const stoppedRate = count > 0 ? stopped / count : 0;
      const share = count / total;
      const label = labels[key] || key;
      return `
        <button type="button" class="persona-kpi persona-kpi-${escapeHtml(key)}" data-persona="${escapeHtml(key)}" aria-label="${escapeHtml(label)} ${formatNumber(count)}件、停止率${(stoppedRate*100).toFixed(1)}%">
          <span class="persona-kpi-label">${escapeHtml(label)}</span>
          <strong class="persona-kpi-count">${formatNumber(count)}</strong>
          <span class="persona-kpi-share">全体の${(share*100).toFixed(1)}%</span>
          <div class="persona-kpi-rate">
            <span class="persona-kpi-rate-label">停止/未収益化</span>
            <strong class="persona-kpi-rate-value">${(stoppedRate*100).toFixed(1)}%</strong>
            <em class="persona-kpi-rate-detail">${formatNumber(stopped)} / ${formatNumber(count)}</em>
          </div>
          <div class="persona-kpi-mini">
            <span class="persona-kpi-mini-monetized" style="width:${(monetized/Math.max(1,count)*100).toFixed(2)}%"></span>
            <span class="persona-kpi-mini-stopped" style="width:${(stoppedRate*100).toFixed(2)}%"></span>
          </div>
        </button>
      `;
    }).join("");
    elements.personaKpiGrid.innerHTML = html;
    elements.personaKpiGrid.querySelectorAll(".persona-kpi").forEach((btn) => {
      btn.addEventListener("click", () => selectPersonaFilter(btn.dataset.persona));
    });
  }

  function renderPersonaStoppedRateChart(counts, cross, labels) {
    if (!elements.personaStoppedRateChart) return;
    const rates = PERSONA_KEYS.map((key) => {
      const count = counts[key] || 0;
      const stopped = (cross[key] || {}).likely_not_monetized || 0;
      return { key, label: labels[key] || key, count, stopped, rate: count > 0 ? stopped / count : 0 };
    });
    const maxRate = Math.max(...rates.map((r) => r.rate), 0.01);
    elements.personaStoppedRateChart.innerHTML = rates.map((r) => `
      <div class="persona-bar-row" data-persona="${escapeHtml(r.key)}" role="button" tabindex="0">
        <div class="persona-bar-label">
          <span class="persona-bar-label-name">${escapeHtml(r.label)}</span>
          <span class="persona-bar-label-detail">${formatNumber(r.stopped)} / ${formatNumber(r.count)}</span>
        </div>
        <div class="persona-bar-track">
          <div class="persona-bar-fill persona-bar-fill-${escapeHtml(r.key)}" style="width:${(r.rate / maxRate * 100).toFixed(2)}%"></div>
        </div>
        <div class="persona-bar-value">${(r.rate * 100).toFixed(1)}%</div>
      </div>
    `).join("");
    elements.personaStoppedRateChart.querySelectorAll(".persona-bar-row").forEach((row) => {
      row.addEventListener("click", () => selectPersonaFilter(row.dataset.persona));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPersonaFilter(row.dataset.persona); }
      });
    });
  }

  function renderPersonaStackChart(cross, labels) {
    if (!elements.personaStackChart) return;
    const STACK_COLORS = {
      likely_monetized: "#14613e",
      likely_not_monetized: "#b0181b",
      inconclusive: "#c69214",
      failed: "#686057",
    };
    const html = PERSONA_KEYS.map((key) => {
      const row = cross[key] || {};
      const total = RESULT_KEYS.reduce((s, c) => s + (row[c] || 0), 0);
      if (!total) return "";
      let cumX = 0;
      const rects = [];
      const labelEls = [];
      RESULT_KEYS.forEach((c) => {
        const count = row[c] || 0;
        if (count <= 0) return;
        const pct = (count / total) * 1000;
        const x = cumX;
        cumX += pct;
        rects.push(`<rect fill="${STACK_COLORS[c]}" x="${x.toFixed(3)}" y="0" width="${pct.toFixed(3)}" height="22"><title>${escapeHtml(RESULT_SHORT[c])}: ${formatNumber(count)} (${(pct/10).toFixed(1)}%)</title></rect>`);
        if (pct >= 60) {
          labelEls.push(`<text x="${(x + pct/2).toFixed(3)}" y="15" text-anchor="middle" fill="#fff" font-size="9" font-weight="800" font-family="Arial,sans-serif">${(pct/10).toFixed(0)}%</text>`);
        }
      });
      return `
        <div class="persona-stack-row" data-persona="${escapeHtml(key)}" role="button" tabindex="0">
          <div class="persona-stack-label">${escapeHtml(labels[key] || key)} <small>(${formatNumber(total)})</small></div>
          <svg class="persona-stack-bar" viewBox="0 0 1000 22" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(labels[key] || key)}の判定内訳"><rect fill="#f1ede2" x="0" y="0" width="1000" height="22"/>${rects.join("")}${labelEls.join("")}</svg>
        </div>
      `;
    }).join("");
    elements.personaStackChart.innerHTML = html;
    elements.personaStackChart.querySelectorAll(".persona-stack-row").forEach((row) => {
      row.addEventListener("click", () => selectPersonaFilter(row.dataset.persona));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPersonaFilter(row.dataset.persona); }
      });
    });
    if (elements.personaStackLegend) {
      elements.personaStackLegend.innerHTML = RESULT_KEYS.map((c) => `
        <span class="persona-stack-legend-item">
          <i class="persona-stack-legend-swatch persona-stack-segment-${escapeHtml(c)}"></i>
          ${escapeHtml(RESULT_SHORT[c])}
        </span>
      `).join("");
    }
  }

  function renderPersonaCrossTable(cross, labels) {
    if (!elements.personaCrossTable) return;
    const tbody = elements.personaCrossTable.querySelector("tbody");
    tbody.innerHTML = PERSONA_KEYS.map((key) => {
      const row = cross[key] || {};
      const total = RESULT_KEYS.reduce((sum, c) => sum + (row[c] || 0), 0);
      const cells = RESULT_KEYS.map((c) => `<td>${formatNumber(row[c] || 0)}</td>`).join("");
      return `
        <tr class="persona-row-${escapeHtml(key)}">
          <th>${escapeHtml(labels[key] || key)}</th>
          ${cells}
          <td><strong>${formatNumber(total)}</strong></td>
        </tr>
      `;
    }).join("");
  }

  function renderPersonaStats() {
    if (!data.summary.personaCounts) return;
    const counts = data.summary.personaCounts || {};
    const cross = data.summary.personaCross || {};
    const labels = data.summary.personaLabels || { personal: "属人", non_personal: "非属人", unknown: "判定不能" };
    renderPersonaKpis(counts, cross, labels);
    renderPersonaStoppedRateChart(counts, cross, labels);
    renderPersonaStackChart(cross, labels);
    renderPersonaCrossTable(cross, labels);
  }

  function populateSourceFilter() {
    if (!elements.sourceFilter) return;
    const counts = {};
    channels.forEach((c) => {
      const s = c.discoverySource || "(未設定)";
      counts[s] = (counts[s] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const current = elements.sourceFilter.value || "all";
    elements.sourceFilter.innerHTML = `<option value="all">すべて (${formatNumber(channels.length)})</option>` +
      sorted.map(([key, n]) => `<option value="${escapeHtml(key)}">${escapeHtml(key)} (${formatNumber(n)})</option>`).join("");
    elements.sourceFilter.value = current;
  }

  function init() {
    elements.generatedAt.textContent = formatDate(data.summary.generatedAt);
    initSourceMeta();
    initFeedbackLinks();
    renderPeriodDashboard();
    renderSummary();
    populateSourceFilter();
    renderResultTabs();
    renderRows();
    [elements.searchInput, elements.confidenceFilter, elements.personaFilter, elements.sourceFilter, elements.sortSelect].forEach((element) => {
      if (!element) return;
      element.addEventListener("input", () => {
        visibleLimit = listPageSize;
        renderRows();
      });
      element.addEventListener("change", () => {
        visibleLimit = listPageSize;
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
