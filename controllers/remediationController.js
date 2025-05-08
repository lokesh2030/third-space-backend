const keywordRouting = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('block') || lower.includes('firewall')) return 'Firewall Team';
  if (lower.includes('reset password') || lower.includes('account')) return 'IT Team';
  if (lower.includes('isolate') || lower.includes('scan') || lower.includes('network')) return 'Network Team';
  return 'Security Team';
};

exports.getRemediations = async (req, res) => {
  // TEMPORARY SAMPLE DATA — replace with triage output later
  const sampleAlerts = [
    {
      alert: 'Suspicious login from Russia detected on admin account',
      action: 'Reset the user password and enable MFA',
    },
    {
      alert: 'Malware beaconing from internal host',
      action: 'Isolate the host and initiate scan',
    },
  ];

  const result = sampleAlerts.map((entry) => ({
    ...entry,
    targetTeam: keywordRouting(entry.action),
  }));

  res.json(result);
};
