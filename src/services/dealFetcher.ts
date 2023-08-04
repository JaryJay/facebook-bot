import { Category } from "./categories";
import { Deal } from "./deal";
import { Region } from "./regions";
import axios, { AxiosRequestConfig } from "axios";


const { Builder, Browser, By, Key, until } = require("selenium-webdriver")

const driver = await new Builder().forBrowser(Browser.CHROME).build();

function generateUrl(category: Category, region: Region): string {
  if (category.all) {
    return `https://www.facebook.com/marketplace/${region.areaID}`;
  } else {
    return `https://www.facebook.com/marketplace/${region.areaID}/search/?daysSinceListed=1&query=${category.keyword.replace(' ', '%20')}&exact=false`;
  }
}

export async function fetchDeals(category: Category, region: Region, amount: number): Promise<Deal[]> {
  const deals: Deal[] = [];
  const url: string = generateUrl(category, region);
  await driver.get(url)
  await driver.manage().window().setRect({x: 0, y: 0, width: 1920, height: 1060})
  await driver.wait(until.elementLocated(By.css("div.x1gslohp.x1e56ztr")), 1000);

  for (let i = 0; i < amount; i++) {
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);")
    // Wait 5 ms
    await new Promise(r => setTimeout(r, 1000));
  }

  const document = new DOMParser().parseFromString(await driver.getPageSource(), "text/html");


  const div = document.querySelectorAll("div.x9f619.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xs83m0k.x1e558r4.x150jy0e.xnpuxes.x291uyu.x1uepa24.x1iorvi4.xjkvuk6")

  div.forEach((el, key, _) => {
    try {
      const link = el.querySelector('div.x3ct3a4 a.x1i10hfl').attributes.getNamedItem("href").value
      const imageLink = el.querySelector('img.xt7dq6l.xl1xv1r.x10wlt62.xh8yej3').attributes.getNamedItem("src").value
      const title = el.querySelector('span.x10wlt62.x1n2onr6').textContent
      const price = el.querySelector('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1lkfr7t.x1lbecb7.x1s688f.xzsf02u').textContent.trim().toLowerCase()
      const url = el.querySelector('a.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5').attributes.getNamedItem("href").value
      const location = el.querySelector('span.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1j85h84').textContent
      const deal: Deal = {
        price: price === "free" ? 0 : parseInt(price.replace(/[Cc,$]/g, ""), 10),
        link: "https://www.facebook.com" + link,
        imageLink: imageLink,
        title: title,
        description: "none",
        location: location,
        date: undefined,
        datePosted: "none",
        category: category,
        isNew: false,
      }
      console.log(`Parsed price string '${price}' into '${deal.price}'`)
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
