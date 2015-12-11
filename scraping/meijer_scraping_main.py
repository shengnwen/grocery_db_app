from bs4 import BeautifulSoup
import urllib2
import time
import re


def keepTrying(url,counter):
    if counter > 1:
        print 'Try',counter
    if counter == 5:
        #let the error occur
        time.sleep(5)
        page = urllib2.urlopen(url)
        soup = BeautifulSoup(page, 'html.parser')
        return soup
    
    time.sleep(3)
    #req = requests.get(url, headers=user_agent)
    try:
        page = urllib2.urlopen(url)
        soup = BeautifulSoup(page, 'html.parser')
        if page and soup:
            return soup
        else:
            print 'Error - page == None'
            keepTrying(url,counter+1)
    except:
        print 'Error'
        keepTrying(url,counter+1)

def get_products_info(soup, cat):
    p_info = []
    
    products = soup.find_all("div", class_="item-wrapper")
    for prod in products:
        #print prod
        prod_title = prod.find(class_='prod-title')
        actual_title = prod_title.text.strip()
        #print actual_title
        plink = prod_title.find("a")['href']
        #print plink

        prod_price = prod.find("div", class_="prodDtlRegPrice")
        full_price = prod_price.text.split()
        if full_price[0] == u'Regular':
            actual_price = full_price[1] #skip the word "Regular"
        else:
            actual_price = full_price[0]
        #make sure we got a price: check if first char is "$"
        if actual_price[0] != '$':
            continue #abort, go to next product
        #else, we got an actual price, so use [1:] to skip the dollar sign ($)
        try:
            actual_price = float(actual_price[1:])
        except: #if could not convert to float for some reason, skip
            continue
        #print actual_price
        #print
        
        p_info.append((actual_title,plink,actual_price,cat))
        
    return p_info
def main():
    hdr = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
           'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
           'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
           'Accept-Encoding': 'none',
           'Accept-Language': 'en-US,en;q=0.8',
           'Connection': 'keep-alive'}

    url = "http://www.meijer.com/t1/grocery/T1-865.uts"

    #get names and links for each main food category
    req = urllib2.Request(url, headers=hdr)
    page = urllib2.urlopen(req)subcats_soups = soup.find_all("a", class_="sub-category-link")
    soup = BeautifulSoup(page, 'html.parser')

    main_categories = dict()
    for subcat in subcats_soups:
        main_categories[subcat.text.strip()] = subcat['href']
    del main_categories['Household & Cleaning']

    #get sub-categories
    sub_categories = dict()
    for maincat,mainlink in sorted(main_categories.items()):
        url = "http://www.meijer.com"+mainlink
        
        req = urllib2.Request(url, headers=hdr)
        soup = keepTrying(req,1)
        #soup = BeautifulSoup(page, 'html.parser')
        
        sub_categories[maincat] = {}

        subcats_soups = soup.find_all("a", class_="sub-category-link")
        for subcat in subcats_soups:

            subcat_plus_total = subcat.text.strip()
            subcat_only = subcat_plus_total.split()[:-1][0]
            #print subcat_only
            #print subcat['href']
            #print

            sub_categories[maincat][subcat_only] = subcat['href']
        print maincat
        print sub_categories[maincat]
        print




    for maincat in [sorted(sub_categories)[12]]:
        for subcat,link in sorted(sub_categories[maincat].items()):
            
            url = "http://www.meijer.com"+link+"?sort=2&page=1&rows=500"
            print "Opening %s" % url

            req = urllib2.Request(url, headers=hdr)
            soup = keepTrying(req,1)
            
            
            pinfo = get_products_info(soup, maincat)
            if pinfo:
                print len(pinfo),pinfo[0]
            super_products_info += pinfo

if __name__ === "__main__":
    main()
