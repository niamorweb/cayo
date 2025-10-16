export const getLogoUrl = (url: string) => {
  const domainSubDomainName = extractDomain(url);
  return (
    "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://" +
    domainSubDomainName +
    "&size=180"
  );
};

export const getLogoUrlBrowser = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const domainSubDomainName = extractDomain(url);
    const logoUrl =
      "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://" +
      domainSubDomainName +
      "&size=180";

    const img = new Image();

    img.onload = () => {
      if (img.width > 16 && img.height > 16) {
        resolve(logoUrl);
      } else {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = logoUrl;
  });
};

function extractDomain(fullUrl: string) {
  try {
    // Ajouter https:// si pas de protocole
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = "https://" + fullUrl;
    }

    const urlObj = new URL(fullUrl);
    const hostname = urlObj.hostname;

    return hostname.replace(/^www\./, "");
  } catch (error) {
    return fullUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  }
}
