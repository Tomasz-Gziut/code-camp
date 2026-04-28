import { requestJson } from "./http";
import { mapCompanyToFirm } from "../features/firms/firmMapper";

const API = "/api";

export async function getFirms() {
  const [companies, eventTypes] = await Promise.all([
    requestJson(`${API}/companies`),
    requestJson(`${API}/events/types`).catch(() => []),
  ]);

  const [scores, eventsByCompany] = await Promise.all([
    Promise.all(
      companies.map((c) =>
        requestJson(`${API}/companies/${c.id}/score`).catch(() => null)
      )
    ),
    Promise.all(
      companies.map((c) =>
        requestJson(`${API}/companies/${c.id}/events`).catch(() => [])
      )
    ),
  ]);

  return companies.map((company, index) =>
    mapCompanyToFirm(company, scores[index], eventsByCompany[index], eventTypes)
  );
}

export async function getFirmById(firmId) {
  const [company, scoreData, events, eventTypes] = await Promise.all([
    requestJson(`${API}/companies/${firmId}`),
    requestJson(`${API}/companies/${firmId}/score`).catch(() => null),
    requestJson(`${API}/companies/${firmId}/events`).catch(() => []),
    requestJson(`${API}/events/types`).catch(() => []),
  ]);

  return mapCompanyToFirm(company, scoreData, events, eventTypes);
}
