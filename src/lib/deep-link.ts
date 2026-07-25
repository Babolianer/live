// No DB imports here on purpose — this gets imported from client components
// (contract/partner-tool cards), so it must stay free of server-only modules.
export function buildDeepLink(tool: {
  deep_link_template: string;
  affiliate_id: string | null;
}): string {
  return tool.deep_link_template.replaceAll("{affiliate_id}", tool.affiliate_id ?? "");
}
