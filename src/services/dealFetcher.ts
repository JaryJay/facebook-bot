import { Category } from "./categories";
import { Deal } from "./deal";
import { Region } from "./regions";
import axios, { AxiosRequestConfig } from "axios";

function generateUrl(category: Category, region: Region, page: number): string {
  if (category.all) {
    return `https://www.kijiji.ca/b-${region.url}${page === 1 ? "" : ("/page-" + page)}/l${region.areaId}`;
  } else {
    return `https://www.kijiji.ca/b-${category.url}/${region.url}${page === 1 ? "" : ("/page-" + page)}/c${category.id}l${region.areaId}`;
  }
}

function parseDate(s: string): Date {
  if (s.startsWith("< ")) {
    s = s.substring(2);
  }
  const now = new Date();
  if (/.*ago/.test(s)) {
    if (/.*minute ago/.test(s)) {
      now.setMinutes(now.getMinutes() - 1);
      return now;
    } else if (/.*minutes ago/.test(s)) {
      now.setMinutes(now.getMinutes() - parseInt(s.substring(0, s.length - 12).trim()));
      return now;
    } else {
      now.setHours(now.getHours() - parseInt(s.substring(0, s.length - 10).trim()));
      return now;
    }
  } else if (s === "yesterday") {
    now.setHours(now.getHours() - 24);
    return now;
  }
  const spl = s.split("/")
  return new Date(Date.parse(`${spl[2]}-${spl[1]}-${spl[0]}`));
}

function extractDeal(category: Category, e: Element): Deal | null {
  let imageLink: string;
  const imageContainer = e.querySelector("div.image > picture");
  imageLink = imageContainer != null ?
    imageContainer.querySelector("img")!.attributes.getNamedItem("data-src")!.value
    : "";

  const dealInfo: Element | null = e.querySelector("div.info-container");
  if (dealInfo == null) {
    return null;
  }
  const title = (dealInfo.querySelector("div.title > a")?.textContent || "").trim();
  const description = (dealInfo.querySelector("div.description")?.textContent || "").trim();
  const link = `https://kijiji.ca${dealInfo.querySelector("div.title > a")?.attributes.getNamedItem("href")?.value || ""}`;
  const location = (dealInfo.querySelector("div.location > span")?.textContent || "").trim();
  const priceString = (dealInfo.querySelector("div.price")?.textContent || "").replace(/[$,]/g, "").trim();
  const datePosted = (dealInfo.querySelector("div.location > span.date-posted")?.textContent || "").trim().toLowerCase();
  let price: number;
  if (!isNaN(parseFloat(priceString))) {
    price = parseFloat(priceString);
  } else {
    price = -1;
  }
  const date = parseDate(datePosted)
  return { imageLink, title, description, link, location, price, date, datePosted, category, isNew: false };
}

export async function fetchDeals(category: Category, region: Region, pages: number): Promise<Deal[]> {
  const deals: Deal[] = [];
  for (let page = 1; page <= pages; page++) {
    const url: string = generateUrl(category, region, page);
    const response = await axios.get(url, {
      params: { "for-sale-by": "ownr" },
      headers: {
        "authority": "www.kijiji.ca",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Access-Control-Allow-Origin": "*"
      }
    } as AxiosRequestConfig)
    const document = new DOMParser().parseFromString(response.data, "text/html");
    const containerResults = document.querySelector("div#MainContainer")!.querySelectorAll("div.container-results");
    const clearfixes = containerResults[containerResults.length - 1].querySelectorAll("div.clearfix");

    clearfixes!.forEach(clearfix => {
      const deal = extractDeal(category, clearfix);
      if (deal) {
        deals.push(deal)
      }
    });
  }
  deals.sort((a, b) => a.link.localeCompare(b.link))
  for (let i = deals.length - 1; i >= 1; i--) {
    if (deals[i].link === deals[i - 1].link) {
      deals.splice(i, 1)
    }
  }
  return deals;
}
