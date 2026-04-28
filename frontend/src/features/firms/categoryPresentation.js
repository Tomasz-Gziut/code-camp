export const CATEGORY_ORDER = [
  "naruszenie danych",
  "partnerstwa i wzrost",
  "postepowania prawne",
  "nagrody i reputacja",
  "nadzor regulacyjny",
];

export const CATEGORY_PRESENTATION = {
  "naruszenie danych": {
    displayName: "Bezpieczenstwo danych",
    emptyDetail: "Brak negatywnych zdarzen w tym obszarze.",
    eventDetail: (count) =>
      `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} w tym obszarze.`,
  },
  "partnerstwa i wzrost": {
    displayName: "Partnerstwa i wzrost",
    emptyDetail: "Brak pozytywnych zdarzen tego typu.",
    eventDetail: (count) =>
      `${count} pozytywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} tego typu.`,
  },
  "postepowania prawne": {
    displayName: "Stabilnosc prawna",
    emptyDetail: "Brak negatywnych zdarzen prawnych.",
    eventDetail: (count) =>
      `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} prawne.`,
  },
  "nagrody i reputacja": {
    displayName: "Nagrody i reputacja",
    emptyDetail: "Brak pozytywnych zdarzen tego typu.",
    eventDetail: (count) =>
      `${count} pozytywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} tego typu.`,
  },
  "nadzor regulacyjny": {
    displayName: "Zgodnosc regulacyjna",
    emptyDetail: "Brak negatywnych sygnalow regulacyjnych.",
    eventDetail: (count) =>
      `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} regulacyjne.`,
  },
};
