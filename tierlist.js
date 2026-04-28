const modes = ["Mace", "Vanilla", "Axe", "Sword", "UHC", "POT", "SMP", "NETH-OP"];
const tiers = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
let currentMode = "Overall";
let allPlayers = [];

const tierScores = {
    HT1: 10,
    LT1: 9,
    HT2: 8,
    LT2: 7,
    HT3: 6,
    LT3: 5,
    HT4: 4,
    LT4: 3,
    HT5: 2,
    LT5: 1
};

const modeIcons = {
    Overall: "img/modes/overall.svg",
    Mace: "img/modes/mace.svg",
    Vanilla: "img/modes/vanilla.svg",
    Axe: "img/modes/axe.svg",
    Sword: "img/modes/sword.svg",
    UHC: "img/modes/uhc.svg",
    POT: "img/modes/pot.svg",
    SMP: "img/modes/smp.svg",
    "NETH-OP": "img/modes/nethop.svg"
};

function getModeIcon(mode) {
    return modeIcons[mode] || "img/modes/overall.svg";
}

async function loadPlayers() {
    const response = await fetch("players.json");
    const text = await response.text();

    if (!text.trim()) {
        return [];
    }

    return JSON.parse(text);
}

function createPlayerEntry(player, extraTiers = []) {
    const entry = document.createElement("div");
    entry.className = "player-entry";

    if (currentMode !== "Overall") {
        entry.classList.add("compact-player-entry");
    }

    entry.tabIndex = 0;
    entry.setAttribute("role", "button");
    entry.setAttribute("aria-label", `Profil von ${player.name} anzeigen`);

    const left = document.createElement("div");
    left.className = "player-left";

    if (player.rank) {
        const rankBadge = document.createElement("span");
        rankBadge.className = "rank-badge";
        rankBadge.textContent = `#${player.rank}`;
        left.appendChild(rankBadge);
    }

    const img = document.createElement("img");
    img.src = `https://minotar.net/avatar/${player.name}/32`;
    img.alt = `${player.name} Avatar`;

    const name = document.createElement("span");
    name.className = "player-name";
    name.textContent = player.name;

    left.appendChild(img);
    left.appendChild(name);

    const right = document.createElement("div");
    right.className = "player-right";

    extraTiers.forEach((info) => {
        const modeDiv = document.createElement("div");
        modeDiv.className = "mode-info";

        const icon = document.createElement("img");
        icon.src = getModeIcon(info.mode);
        icon.alt = info.mode;

        const tierLabel = document.createElement("span");
        tierLabel.textContent = info.tier;

        modeDiv.appendChild(icon);
        modeDiv.appendChild(tierLabel);
        right.appendChild(modeDiv);
    });

    entry.appendChild(left);
    entry.appendChild(right);

    entry.addEventListener("click", () => openPlayerModal(player.name));
    entry.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPlayerModal(player.name);
        }
    });

    return entry;
}

function calculateOverallList(players) {
    const uniqueNames = [...new Set(players.map((player) => player.name))];

    const overallList = uniqueNames.map((name) => {
        const playerEntries = players.filter((player) => player.name === name);
        const scoredEntries = playerEntries.filter((entry) => tierScores[entry.tier] !== undefined);
        const totalScore = scoredEntries.reduce((sum, entry) => sum + tierScores[entry.tier], 0);
        const averageScore = scoredEntries.length ? totalScore / scoredEntries.length : 0;
        const modeMap = new Map(playerEntries.map((entry) => [entry.mode, entry.tier]));

        return {
            name,
            averageScore,
            modeCount: scoredEntries.length,
            modes: modes.map((mode) => ({
                mode,
                tier: modeMap.get(mode) || "-"
            }))
        };
    });

    overallList.sort((a, b) => {
        if (b.averageScore !== a.averageScore) {
            return b.averageScore - a.averageScore;
        }

        if (b.modeCount !== a.modeCount) {
            return b.modeCount - a.modeCount;
        }

        return a.name.localeCompare(b.name);
    });

    return overallList.map((player, index) => ({
        ...player,
        rank: index + 1
    }));
}

function renderTierlist(players) {
    const container = document.getElementById("tierlist-container");
    container.innerHTML = "";

    if (currentMode === "Overall") {
        const overallList = calculateOverallList(players);

        overallList.forEach((player) => {
            const entry = createPlayerEntry({ name: player.name, rank: player.rank }, player.modes);
            container.appendChild(entry);
        });

        return;
    }

    const board = document.createElement("section");
    board.className = "tier-board";

    for (let tierIndex = 1; tierIndex <= 5; tierIndex += 1) {
        const column = document.createElement("section");
        column.className = "tier-column";

        const columnTitle = document.createElement("div");
        columnTitle.className = "tier-column-title";
        columnTitle.textContent = `T${tierIndex}`;
        column.appendChild(columnTitle);

        const tierPlayers = players.filter((player) => {
            if (player.mode !== currentMode || !player.tier) {
                return false;
            }

            return player.tier.endsWith(`${tierIndex}`);
        });

        const section = document.createElement("div");
        section.className = "tier-section compact-tier-section";

        const heading = document.createElement("div");
        heading.className = "tier-heading";

        const title = document.createElement("div");
        title.className = "tier-title";
        title.textContent = `T${tierIndex}`;

        const count = document.createElement("span");
        count.className = "tier-count";
        count.textContent = `${tierPlayers.length} Spieler`;

        heading.appendChild(title);
        heading.appendChild(count);
        section.appendChild(heading);

        if (!tierPlayers.length) {
            const emptyState = document.createElement("p");
            emptyState.className = "empty-tier";
            emptyState.textContent = "Kein Eintrag";
            section.appendChild(emptyState);
        } else {
            tierPlayers.forEach((player) => section.appendChild(createPlayerEntry(player)));
        }

        column.appendChild(section);

        board.appendChild(column);
    }

    container.appendChild(board);
}

function buildPlayerProfile(name) {
    const playerEntries = allPlayers.filter((player) => player.name === name);
    const overallList = calculateOverallList(allPlayers);
    const overallEntry = overallList.find((player) => player.name === name);
    const modeMap = new Map(playerEntries.map((entry) => [entry.mode, entry.tier]));

    const wrapper = document.createElement("div");
    wrapper.className = "profile-layout";

    const top = document.createElement("div");
    top.className = "profile-top";

    const identity = document.createElement("div");
    identity.className = "profile-identity";

    const avatar = document.createElement("img");
    avatar.className = "profile-avatar";
    avatar.src = `https://minotar.net/avatar/${name}/64`;
    avatar.alt = `${name} Avatar`;

    const identityText = document.createElement("div");

    const heading = document.createElement("h2");
    heading.id = "modal-player-name";
    heading.textContent = name;

    const subtitle = document.createElement("p");
    subtitle.className = "profile-subtitle";
    subtitle.textContent = "Alle Modi und Overall-Ranking";

    identityText.appendChild(heading);
    identityText.appendChild(subtitle);
    identity.appendChild(avatar);
    identity.appendChild(identityText);

    const stats = document.createElement("div");
    stats.className = "profile-stats";

    const overallStat = document.createElement("div");
    overallStat.className = "profile-stat";
    overallStat.innerHTML = `<span>Overall</span><strong>#${overallEntry ? overallEntry.rank : "-"}</strong>`;

    const playedStat = document.createElement("div");
    playedStat.className = "profile-stat";
    playedStat.innerHTML = `<span>Mit Rang</span><strong>${playerEntries.length}/${modes.length}</strong>`;

    stats.appendChild(overallStat);
    stats.appendChild(playedStat);
    top.appendChild(identity);
    top.appendChild(stats);
    wrapper.appendChild(top);

    const board = document.createElement("div");
    board.className = "profile-mode-row";

    modes.forEach((mode) => {
        const item = document.createElement("div");
        item.className = "profile-mode-info";

        const icon = document.createElement("img");
        icon.className = "profile-mode-icon";
        icon.src = getModeIcon(mode);
        icon.alt = mode;

        const tierValue = document.createElement("strong");
        tierValue.className = "profile-mode-tier";
        tierValue.textContent = modeMap.get(mode) || "-";

        item.appendChild(icon);
        item.appendChild(tierValue);
        board.appendChild(item);
    });

    wrapper.appendChild(board);

    return wrapper;
}

function openPlayerModal(name) {
    const modal = document.getElementById("player-modal");
    const content = document.getElementById("modal-content");

    content.innerHTML = "";
    content.appendChild(buildPlayerProfile(name));
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closePlayerModal() {
    const modal = document.getElementById("player-modal");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function setupTabs(players) {
    const nav = document.getElementById("mode-tabs");
    nav.innerHTML = "";

    const allModes = ["Overall", ...modes];
    allModes.forEach((mode) => {
        const button = document.createElement("button");
        button.className = "mode-tab";

        if (mode === currentMode) {
            button.classList.add("active");
        }

        const icon = document.createElement("img");
        icon.src = getModeIcon(mode);
        icon.alt = mode;

        const label = document.createElement("span");
        label.textContent = mode;

        button.appendChild(icon);
        button.appendChild(label);

        button.onclick = () => {
            currentMode = mode;
            document.querySelectorAll("nav button").forEach((tab) => tab.classList.remove("active"));
            button.classList.add("active");
            renderTierlist(players);
        };

        nav.appendChild(button);
    });
}

window.onload = async () => {
    document.getElementById("close-modal").addEventListener("click", closePlayerModal);
    document.getElementById("player-modal").addEventListener("click", (event) => {
        if (event.target.dataset.closeModal === "true") {
            closePlayerModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePlayerModal();
        }
    });

    setupTabs([]);

    try {
        const players = await loadPlayers();
        allPlayers = players;
        setupTabs(players);
        renderTierlist(players);
    } catch (error) {
        console.error("Tierlist konnte nicht geladen werden:", error);
        allPlayers = [];
        renderTierlist([]);
    }
};
