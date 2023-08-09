import { Category } from "./categories";
import { Deal } from "./deal";
import { Region } from "./regions";

const { Builder, Browser, By, Key, until, WebDriver } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")


function generateUrl(category: Category, region: Region): string {
  if (category.all) {
    return `https://www.facebook.com/marketplace/${region.areaID}`;
  } else {
    return `https://www.facebook.com/marketplace/${region.areaID}/search/?daysSinceListed=1&sortBy=creation_time_descend&query=${category.keyword.replace(' ', '%20')}&exact=false`;
  }
}

export async function fetchDeals(category: Category, region: Region, amount: number): Promise<Deal[]> {
  const deals: Deal[] = [];

  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(new chrome.Options().headless())
    .build()
  const url: string = generateUrl(category, region);
  console.log(`Fetching ${url}`)
  await driver.get(url)
  await driver.manage().window().setRect({ x: 0, y: 0, width: 1920, height: 1060 })
  await driver.wait(until.elementLocated(By.css("div.x1gslohp.x1e56ztr")), 10 * 1000);

  for (let i = 0; i < amount; i++) {
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);")
    // Wait 1 second
    await new Promise(r => setTimeout(r, 1000));
  }

  const document = new DOMParser().parseFromString(await driver.getPageSource(), "text/html");

  await driver.quit()

  const div = document.querySelectorAll("div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xs83m0k.x1e558r4.x150jy0e")

  div.forEach((el, key, _) => {
    try {
      const link = el.querySelector('div.x3ct3a4 a.x1i10hfl')?.attributes.getNamedItem("href")?.value
      const imageLink = el.querySelector('img.xt7dq6l.xl1xv1r.x10wlt62.xh8yej3')?.attributes.getNamedItem("src")?.value
      const title = el.querySelector('span.x10wlt62.x1n2onr6')?.textContent
      const price = el.querySelector('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs')?.textContent?.trim().toLowerCase() || "0"
      const url = el.querySelector('a.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou')?.attributes.getNamedItem("href")?.value
      const location = el.querySelector('span.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1j85h84')?.textContent
      const deal: Deal = {
        price: price === "free" ? 0 : parseInt(price.replace(/[Cc,$]/g, ""), 10),
        link: "https://www.facebook.com" + link,
        imageLink: imageLink || "",
        title: title || "",
        description: "none",
        location: location || "",
        date: undefined,
        datePosted: "none",
        category: category,
        isNew: false,
      }
      deals.push(deal)
    } catch (exception) {
    }
  })
  deals.sort((a, b) => a.link.localeCompare(b.link))
  for (let i = deals.length - 1; i >= 1; i--) {
    if (deals[i].link === deals[i - 1].link) {
      deals.splice(i, 1)
    }
  }
  return deals;
}
