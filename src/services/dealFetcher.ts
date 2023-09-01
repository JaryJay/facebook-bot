import { categories, Category } from "./categories";
import { Deal } from "./deal";
import { Region } from "./regions";
import { FetchMode } from "./fetchModes";

const { Builder, Browser, By, Key, until, WebDriver } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")


function generateUrl(category: Category, region: Region, fetchMode: FetchMode): string {
  if (category.all) {
    return `https://www.facebook.com/marketplace/${region.areaID}`;
  } else {
    const sortBy = fetchMode.code.length ? `sortBy=${fetchMode.code}&` : ""
    return `https://www.facebook.com/marketplace/${region.areaID}/search/?query=${category.keyword.replace(' ', '%20')}&exact=false`;
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

async function deleteLoginPrompt(driver, timeout: number) {
  try {
    await driver.wait(until.elementLocated(By.css("div.x1iyjqo2.xl56j7k.xshlqvt")), timeout)
    await driver.executeScript('return document.querySelectorAll("div.x1n2onr6.x1vjfegm")[1].remove();')
  } catch (e) {
  }
}

async function waitUntilDialogCloses(driver, timeout: number) {
  for (let i = 0; i < timeout / 10; i++) {
    try {
      await driver.wait(until.elementLocated(By.css("div.x1n2onr6.xzkaem6")), 10)
    } catch (e) {
      return
    }
  }
  return
}

export async function fetchDeals(category: Category, region: Region, fetchMode: FetchMode, amount: number, fetchStatus: { s: string }): Promise<Deal[] | null> {
  const deals: Deal[] = [];

  if (category.custom) {
    const promises: Promise<Deal[]>[] = []
    const midIndex = (categories.length - 2) / 2 + 2

    // Do first half
    for (let i = 2; i < midIndex; i++) {
      const cat = categories[i]
      promises.push(fetchDeals(cat, region, fetchMode, 1, fetchStatus))
    }
    (await Promise.all(promises)).forEach(dealsList => deals.push(...dealsList))

    // Do second half
    promises.length = 0
    for (let i = midIndex; i < categories.length; i++) {
      const cat = categories[i]
      promises.push(fetchDeals(cat, region, fetchMode, 1, fetchStatus))
    }
    (await Promise.all(promises)).forEach(dealsList => deals.push(...dealsList))

    return deals
  }

  setStatus(fetchStatus, `Preparing to fetch ${category.name}...`)

  try {
    const driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(new chrome.Options())
      .build()
    const url: string = generateUrl(category, region, fetchMode);
    console.log(`Fetching ${url}`)
    setStatus(fetchStatus, `Accessing webpage for ${category.name}...`)
    await driver.get(url)
    await driver.manage().window().setRect({ x: 0, y: 0, width: 1920, height: 1060 })

    setStatus(fetchStatus, `Applying fetch settings for ${category.name}...`)

    // Click distance filter
    await driver.wait(until.elementLocated(By.css("div.x1i10hfl.x1xmf6yo")), 10 * 1000)

    const distanceFilterButton = await driver.findElement(By.css("div.x1i10hfl.x1xmf6yo"))
    await deleteLoginPrompt(driver, 1000);
    await distanceFilterButton.click()

    // Click "Radius" dropdown
    await driver.wait(until.elementLocated(By.css("label.x1ypdohk")), 10 * 1000)
    await deleteLoginPrompt(driver, 10);
    await (await driver.findElement(By.css("label.x1ypdohk"))).click()

    // Click "20 km"
    await driver.wait(until.elementLocated(By.css("div.x6umtig.x1ja2u2z")), 200)
    await deleteLoginPrompt(driver, 10);
    await (await driver.findElements(By.css("div.x6umtig.x1ja2u2z")))[4].click()

    await deleteLoginPrompt(driver, 10);
    await (await driver.findElement(By.css("div.xjbqb8w.x6umtig[aria-label=\"Apply\"]"))).click() // Click Apply
    await waitUntilDialogCloses(driver, 5000)
    await deleteLoginPrompt(driver, 10);
    await (await driver.findElement(By.css("div.xqvfhly"))).click() // Click Sort By
    await deleteLoginPrompt(driver, 10);
    await (await driver.findElements(By.css("div.x1lliihq")))[fetchMode.index].click() // Click fetch mode

    await (await driver.findElements(By.css("div.xqvfhly")))[3].click() // Click Date Listed
    await (await (await driver.findElements(By.css("div.xb57i2i.xxqldzo")))[3].findElements(By.css("div.x1lliihq")))[1].click()

    setStatus(fetchStatus, `Downloading deals from ${category.name}...`, true)

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
    console.error(`Hey! An error has occurred while fetching ${category.name}.\n${e.message}\n${e.stack}`)
    return null
  }
}

