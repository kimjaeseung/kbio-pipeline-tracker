import { PHASE_ORDER } from './constants';

export function drugToSlug(drug) {
  return drug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function getMaxPhase(pipelines) {
  return Math.max(...pipelines.map(p => PHASE_ORDER[p.phase] || 0));
}

export function getLeadPipeline(pipelines) {
  const max = getMaxPhase(pipelines);
  return pipelines.find(p => (PHASE_ORDER[p.phase] || 0) === max);
}

export function findCompanyByDrug(companies, drugSlug) {
  for (const company of companies) {
    for (const pipeline of company.pipelines) {
      if (drugToSlug(pipeline.drug) === drugSlug) {
        return { company, pipeline };
      }
    }
  }
  return null;
}

export function findPipelineBySlug(companies, drugSlug) {
  for (const company of companies) {
    for (const pipeline of company.pipelines) {
      if (drugToSlug(pipeline.drug) === drugSlug) {
        return { company, pipeline };
      }
    }
  }
  return null;
}

export function getAllPipelines(companies) {
  return companies.flatMap(c => c.pipelines.map(p => ({ ...p, companyName: c.name, companyId: c.id })));
}

export function countClinical(companies) {
  return companies.reduce((s, c) => s + c.pipelines.filter(p => (PHASE_ORDER[p.phase] || 0) >= 3).length, 0);
}

export function countApproved(companies) {
  return companies.reduce((s, c) => s + c.pipelines.filter(p => (PHASE_ORDER[p.phase] || 0) >= 7).length, 0);
}
