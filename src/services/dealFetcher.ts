import { Category, categories } from "./categories";
import { Deal } from "./deal";
import { Region } from "./regions";
import { FetchMode } from "./fetchModes";

const { Builder, Browser, By, Key, until, WebDriver } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")


function generateUrl(category: Category, region: Region, fetchMode: FetchMode): string {
  if (category.all) {
    return `https://www.facebook.com/marketplace/${region.areaID}`;
  } else {
    const sortBy = fetchMode.code.length ? `&sortBy=${fetchMode.code}` : ""
    return `https://www.facebook.com/marketplace/${region.areaID}/search/?daysSinceListed=1${sortBy}&query=${category.keyword.replace(' ', '%20')}&exact=false`;
  }
}

const funnyMessages = [
  "Contacting Mark Zuckerberg...",
  "Hacking into the mainframe...",
  "Fetching confidential information...",
  "Injecting SQL...",
  "Filtering out viruses...",
  "Enhance, enhance, enhance!",
  "Leaving \"normal facebook users\" in the dust...",
  "Doing some crazy javascript magic..."
]

function setStatus(fetchStatus: { s: string }, status: string, enableFunny = false) {
  // 2% chance of displaying a funny message :)
  if (enableFunny && Math.random() < 0.02) {
    fetchStatus.s = funnyMessages[Math.floor(Math.random() * funnyMessages.length + 1)]
  } else {
    fetchStatus.s = status
  }
}

export async function fetchDeals(category: Category, region: Region, fetchMode: FetchMode, amount: number, fetchStatus: { s: string }): Promise<Deal[]> {
  const deals: Deal[] = [];

  if (category.custom) {
    // From Phones to iPhones
    for (let i = 2; i < categories.length; i++) {
      const cat = categories[i]
      deals.push(...await fetchDeals(cat, region, fetchMode, 1, fetchStatus))
    }
    return deals
  }

  setStatus(fetchStatus, `Preparing to fetch ${category.name}...`)

  try {
    const driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(new chrome.Options().headless())
      .build()
    const url: string = generateUrl(category, region, fetchMode);
    console.log(`Fetching ${url}`)
    setStatus(fetchStatus, `Accessing webpage for ${category.name}...`)
    await driver.get(url)
    await driver.manage().window().setRect({ x: 0, y: 0, width: 1920, height: 1060 })
    setStatus(fetchStatus, `Waiting for page to load for ${category.name}...`)
    await driver.wait(until.elementLocated(By.css("div.x1gslohp.x1e56ztr")), 10 * 1000);

    setStatus(fetchStatus, "Downloading deals...", true)

    for (let i = 0; i < amount; i++) {
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);")
      // Wait 1 second
      await new Promise(r => setTimeout(r, 1000));
    }

    setStatus(fetchStatus, "Refreshing...")

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
        if (!link) {
          return
        }
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
        if (deal.price === 143) {
          console.log(`Deleting deal "${title}" because its price is $143.`)
        } else {
          deals.push(deal)
        }
      } catch (exception) {
      }
    })
    // deals.sort((a, b) => a.link.localeCompare(b.link))
    for (let i = deals.length - 1; i >= 1; i--) {
      if (deals[i].link === deals[i - 1].link) {
        deals.splice(i, 1)
      }
    }
    return deals;
  } catch (e: any) {
    alert(`Hey! An error has occurred while fetching ${category.name}.\n${e.message}\n${e.stack}`)
    console.error(`Hey! An error has occurred while fetching ${category.name}.\n${e.message}\n${e.stack}`)
    return []
  }
}

