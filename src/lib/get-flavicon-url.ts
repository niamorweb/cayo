function getFaviconUrl(url: any) {
  if (!url || typeof url !== "string") {
    return;
  }
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
  } catch (e) {
    console.error("URL invalide :", e);
    return null;
  }
}

export { getFaviconUrl };
