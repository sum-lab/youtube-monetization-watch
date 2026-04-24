(function () {
  const data = window.MONETIZATION_REPORT_DATA || { summary: {}, channels: [] };
  const channels = data.channels || [];
  const labels = (data.summary && data.summary.labels) || {};
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

  function initFeedbackLinks() {
    const url = issueUrl();
    if (elements.globalFeedbackLink) elements.globalFeedbackLink.href = url;
    if (elements.feedbackPanelLink) elements.feedbackPanelLink.href = url;
  }

  function init() {
    elements.generatedAt.textContent = formatDate(data.summary.generatedAt);
    initFeedbackLinks();
    renderSummary();
    renderRows();
    [elements.searchInput, elements.resultFilter, elements.confidenceFilter, elements.sortSelect].forEach((element) => {
      element.addEventListener("input", renderRows);
      element.addEventListener("change", renderRows);
    });
  }

  init();
})();

