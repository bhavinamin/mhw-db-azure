import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronDown, Database, Gem, MapPinned, Search, Shield, Skull, Swords, Trophy } from "lucide-react";
import monsterData from "./data/monsters.json";
import heroArt from "./assets/monster-field-guide-hero.png";
import "./styles.css";

const ELEMENTS = ["fire", "water", "thunder", "ice", "dragon"];
const SORTS = [
  ["name", "Name"],
  ["species", "Species"],
  ["type", "Type"],
  ["rewards", "Rewards"],
];

function App() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [species, setSpecies] = useState("all");
  const [element, setElement] = useState("all");
  const [sort, setSort] = useState("name");
  const [selectedId, setSelectedId] = useState(null);

  const filters = useMemo(() => buildFilters(monsterData.monsters), []);
  const monsters = useMemo(
    () => filterMonsters(monsterData.monsters, { query, type, species, element, sort }),
    [query, type, species, element, sort],
  );
  const selected = monsterData.monsters.find((monster) => monster.id === selectedId);

  return (
    <main className="app-shell">
      <div className="layout">
        <aside className="sidebar">
          <section className="side-panel art-panel site-title-panel" style={{ backgroundImage: `url(${heroArt})` }}>
            <div>
              <strong>MHW Field Guide</strong>
            </div>
          </section>

          <section className="side-panel">
            <h2>Monsters</h2>
            <nav className="side-nav" aria-label="Monster type navigation">
              <button className={type === "all" ? "active" : ""} type="button" onClick={() => setType("all")}>
                All
                <span>{monsterData.monsters.length}</span>
              </button>
              {filters.types.map((value) => (
                <button
                  className={type === value ? "active" : ""}
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                >
                  {toTitle(value)}
                  <span>{monsterData.monsters.filter((monster) => monster.type === value).length}</span>
                </button>
              ))}
            </nav>
          </section>

          <section className="side-panel">
            <h2>Species</h2>
            <div className="species-list">
              {filters.species.map((value) => (
                <button
                  className={species === value ? "active" : ""}
                  key={value}
                  type="button"
                  onClick={() => setSpecies(species === value ? "all" : value)}
                >
                  {toTitle(value)}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="content">
          <header className="page-header">
            <div>
              <div className="breadcrumb">Database / Monsters / World</div>
              <p>Cached from MHW DB on {formatDateTime(monsterData.cachedAt)}.</p>
            </div>
          </header>

          <section className="table-panel">
            <PanelTitle icon={Database} title="Monster Index" meta={`${monsters.length} rows`} />
            <section className="index-filters" aria-label="Monster index filters">
              <label className="search-field">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search by monster, location, ailment, reward..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <Select label="Species" value={species} onChange={setSpecies} options={filters.species} />
              <Select label="Weakness" value={element} onChange={setElement} options={ELEMENTS} />
              <Select label="Sort" value={sort} onChange={setSort} options={SORTS} rawOptions />
            </section>
            <MonsterIndex monsters={monsters} selectedId={selected?.id} onSelect={setSelectedId} />
          </section>
        </section>
      </div>
      <MonsterDrawer monster={selected} onClose={() => setSelectedId(null)} />
    </main>
  );
}

function Select({ label, value, onChange, options, rawOptions = false }) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {!rawOptions ? <option value="all">All</option> : null}
          {options.map((option) => {
            const optionValue = rawOptions ? option[0] : option;
            const optionLabel = rawOptions ? option[1] : toTitle(option);
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown size={14} />
      </div>
    </label>
  );
}

function MonsterIndex({ monsters, selectedId, onSelect }) {
  if (!monsters.length) {
    return <div className="empty-state">No matching monsters.</div>;
  }

  return (
    <>
      <div className="monster-index-header">
        <span />
        <span>Monster</span>
        <span>Species</span>
        <span>Weakness</span>
      </div>
      <div className="monster-index" id="monsters">
        {monsters.map((monster) => (
          <button
            className={monster.id === selectedId ? "monster-row active" : "monster-row"}
            key={monster.id}
            type="button"
            onClick={() => onSelect(monster.id)}
          >
            <MonsterIcon monster={monster} />
            <span className="monster-name">{monster.name}</span>
            <span>{toTitle(monster.species)}</span>
            <ElementDots weaknesses={monster.weaknesses} />
          </button>
        ))}
      </div>
    </>
  );
}

function MonsterDrawer({ monster, onClose }) {
  return (
    <aside className={monster ? "drawer open" : "drawer"} aria-hidden={!monster}>
      {monster ? (
        <>
          <button className="drawer-close" type="button" onClick={onClose}>
            Close
          </button>
          <MonsterPage monster={monster} />
        </>
      ) : null}
    </aside>
  );
}

function MonsterPage({ monster }) {
  if (!monster) return null;

  const rewardRows = flattenRewards(monster).slice(0, 28);

  return (
    <article className="detail-page">
      <section className="monster-heading">
        <MonsterIcon monster={monster} large />
        <div>
          <div className="breadcrumb">{toTitle(monster.type)} / {toTitle(monster.species)}</div>
          <h2>{monster.name}</h2>
          <p>{monster.description}</p>
        </div>
      </section>

      <section className="facts">
        <Fact icon={Skull} label="Species" value={toTitle(monster.species)} />
        <Fact icon={Swords} label="Type" value={toTitle(monster.type)} />
        <Fact icon={MapPinned} label="Habitats" value={monster.locations.length || "None"} />
        <Fact icon={Trophy} label="Rewards" value={monster.rewards.length} />
      </section>

      <section className="section-table" id="weaknesses">
        <PanelTitle icon={Gem} title="Elemental Weakness" />
        <table>
          <thead>
            <tr>
              {ELEMENTS.map((element) => (
                <th key={element}>{toTitle(element)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {ELEMENTS.map((element) => (
                <td key={element}>
                  <WeaknessCell element={element} monster={monster} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section-table">
        <PanelTitle icon={Shield} title="Ailments and Resistances" />
        <table>
          <tbody>
            <tr>
              <th>Ailments</th>
              <td>{listNames(monster.ailments) || "None listed"}</td>
            </tr>
            <tr>
              <th>Resistances</th>
              <td>{monster.resistances.map((item) => toTitle(item.element)).join(", ") || "None listed"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section-table" id="locations">
        <PanelTitle icon={MapPinned} title="Locations" />
        <table>
          <thead>
            <tr>
              <th>Area</th>
            </tr>
          </thead>
          <tbody>
            {monster.locations.map((location) => (
              <tr key={location.id}>
                <td>{location.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section-table" id="rewards">
        <PanelTitle icon={Trophy} title="Rewards" />
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Rank</th>
              <th>Source</th>
              <th>Qty</th>
              <th>Chance</th>
            </tr>
          </thead>
          <tbody>
            {rewardRows.map((reward) => (
              <tr key={`${reward.item}-${reward.rank}-${reward.type}-${reward.subtype}-${reward.chance}`}>
                <td>
                  <span className="item-name">{reward.item}</span>
                </td>
                <td>{toTitle(reward.rank)}</td>
                <td>{toTitle([reward.type, reward.subtype].filter(Boolean).join(" "))}</td>
                <td>{reward.quantity}</td>
                <td>{reward.chance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}

function PanelTitle({ icon: Icon, title, meta }) {
  return (
    <div className="panel-title">
      <h2>
        <Icon size={16} />
        {title}
      </h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="fact">
      <Icon size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MonsterIcon({ monster, large = false }) {
  return (
    <span className={`monster-icon type-${monster.type} ${large ? "size-large" : ""}`}>
      {monster.icon ? <img src={monster.icon} alt="" /> : monster.type === "large" ? "L" : "S"}
    </span>
  );
}

function ElementDots({ weaknesses }) {
  const strongest = strongestWeaknesses(weaknesses);

  if (!strongest.length) {
    return <span className="muted">None</span>;
  }

  return (
    <span className="weakness-summary">
      {strongest.map((weakness) => (
        <span className={`weakness-text ${weakness.element}`} key={`${weakness.element}-${weakness.condition || ""}`}>
          {toTitle(weakness.element)}
        </span>
      ))}
    </span>
  );
}

function WeaknessCell({ element, monster }) {
  const weakness = monster.weaknesses.find((item) => item.element === element);
  const resistance = monster.resistances.find((item) => item.element === element);

  if (resistance) {
    return <span className="resist">Resist</span>;
  }

  if (!weakness) {
    return <span className="muted">-</span>;
  }

  return (
    <span className="weakness">
      <StarRating value={weakness.stars} element={element} />
      {weakness.condition ? <small>{weakness.condition}</small> : null}
    </span>
  );
}

function StarRating({ value, element }) {
  return (
    <span className={`star-rating ${element}`} aria-label={`${value} star weakness`}>
      {Array.from({ length: 3 }, (_, index) => (
        <span className={index < value ? "filled" : ""} key={index}>
          ★
        </span>
      ))}
    </span>
  );
}

function buildFilters(monsters) {
  return {
    types: unique(monsters.map((monster) => monster.type)),
    species: unique(monsters.map((monster) => monster.species)),
  };
}

function filterMonsters(monsters, filters) {
  const q = filters.query.trim().toLowerCase();

  return monsters
    .filter((monster) => {
      const haystack = [
        monster.name,
        monster.type,
        monster.species,
        monster.description,
        ...monster.locations.map((location) => location.name),
        ...monster.ailments.map((ailment) => ailment.name),
        ...monster.rewards.map((reward) => reward.item.name),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (filters.type === "all" || monster.type === filters.type) &&
        (filters.species === "all" || monster.species === filters.species) &&
        (filters.element === "all" || monster.weaknesses.some((weakness) => weakness.element === filters.element))
      );
    })
    .sort((a, b) => {
      if (filters.sort === "species") return a.species.localeCompare(b.species) || a.name.localeCompare(b.name);
      if (filters.sort === "type") return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      if (filters.sort === "rewards") return b.rewards.length - a.rewards.length || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
}

function flattenRewards(monster) {
  return monster.rewards
    .flatMap((reward) =>
      reward.conditions.map((condition) => ({
        item: reward.item.name,
        rank: condition.rank,
        type: condition.type,
        subtype: condition.subtype,
        quantity: condition.quantity,
        chance: condition.chance,
      })),
    )
    .sort((a, b) => b.chance - a.chance || a.item.localeCompare(b.item));
}

function strongestWeaknesses(weaknesses) {
  const threeStar = weaknesses.filter((weakness) => weakness.stars === 3);
  if (threeStar.length) return sortWeaknesses(threeStar);

  return sortWeaknesses(weaknesses.filter((weakness) => weakness.stars === 2));
}

function sortWeaknesses(weaknesses) {
  return [...weaknesses].sort((a, b) => ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element));
}

function listNames(items) {
  return items.map((item) => item.name).join(", ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function toTitle(value = "") {
  return String(value)
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
    .join(" ");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

createRoot(document.getElementById("root")).render(<App />);
