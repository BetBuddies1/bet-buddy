// Audit gate: every npm audit finding fails CI unless an active, narrowly scoped
// exception covers it. Production dependencies never get exceptions.

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const advisoryPattern = /^GHSA(-[0-9a-z]{4}){3}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function advisoryId(advisory) {
  const url = typeof advisory.url === 'string' ? advisory.url : '';
  return url.slice(url.lastIndexOf('/') + 1);
}

function checkReport(report, label, errors) {
  if (!report || typeof report !== 'object' || report.error || report.auditReportVersion !== 2) {
    errors.push(`${label}: npm audit did not return a valid report.`);
    return false;
  }
  return true;
}

function validateException(exception, index, today, errors) {
  const where = `Exception #${index + 1}`;
  const { advisory, packages, maxSeverity, expires } = exception ?? {};

  if (typeof advisory !== 'string' || !advisoryPattern.test(advisory)) {
    errors.push(`${where}: invalid advisory id.`);
    return false;
  }
  if (!Array.isArray(packages) || packages.length === 0 || !packages.every((name) => typeof name === 'string')) {
    errors.push(`${where} (${advisory}): packages must be a non-empty list.`);
    return false;
  }
  if (!(maxSeverity in severityRank)) {
    errors.push(`${where} (${advisory}): invalid maxSeverity.`);
    return false;
  }
  if (typeof expires !== 'string' || !datePattern.test(expires) || Number.isNaN(Date.parse(expires))) {
    errors.push(`${where} (${advisory}): invalid expires date.`);
    return false;
  }
  if (today > expires) {
    errors.push(`${where} (${advisory}): expired on ${expires}. Review again.`);
    return false;
  }
  return true;
}

export function evaluateAudit({ fullReport, prodReport, exceptions, today }) {
  const errors = [];
  const warnings = [];
  const covered = [];

  const fullOk = checkReport(fullReport, 'All dependencies', errors);
  const prodOk = checkReport(prodReport, 'Production dependencies', errors);

  if (prodOk && Object.keys(prodReport.vulnerabilities ?? {}).length > 0) {
    errors.push(
      `Production dependencies are vulnerable (no exceptions allowed): ${Object.keys(prodReport.vulnerabilities).join(', ')}`,
    );
  }

  if (!Array.isArray(exceptions)) {
    errors.push('Exception list is invalid.');
    return { errors, warnings, covered };
  }

  const active = exceptions.filter((exception, index) => validateException(exception, index, today, errors));
  const used = new Set();

  const withinLimit = (exception, severity) =>
    severity in severityRank && severityRank[severity] <= severityRank[exception.maxSeverity];

  if (fullOk) {
    for (const [name, entry] of Object.entries(fullReport.vulnerabilities ?? {})) {
      const advisories = (entry.via ?? []).filter((via) => typeof via === 'object' && via !== null);
      const matches = active.filter(
        (exception) => exception.packages.includes(name) && withinLimit(exception, entry.severity),
      );

      if (matches.length === 0) {
        errors.push(`${name} (${entry.severity}): not covered by an active exception.`);
        continue;
      }

      let entryOk = true;
      for (const advisory of advisories) {
        const id = advisoryId(advisory);
        const exception = matches.find((candidate) => candidate.advisory === id && withinLimit(candidate, advisory.severity));
        if (!exception) {
          errors.push(`${name}: ${id || 'unknown advisory'} (${advisory.severity}) is not covered by an active exception.`);
          entryOk = false;
          continue;
        }
        used.add(exception);
      }

      if (entryOk) {
        covered.push(name);
      }
    }
  }

  for (const exception of active) {
    if (fullOk && !used.has(exception)) {
      warnings.push(`${exception.advisory}: exception is no longer needed and can be removed.`);
    }
  }

  return { errors, warnings, covered };
}
