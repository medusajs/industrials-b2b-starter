// WebMCP (experimental) declarative tool annotations for in-browser agents.
export const webMcpTool = (name: string, description: string): Record<string, string> => ({
  toolname: name,
  tooldescription: description,
})
