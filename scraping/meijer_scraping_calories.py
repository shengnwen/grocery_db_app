from bs4 import BeautifulSoup
import urllib2
import re

hdr = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
       'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
       'Accept-Encoding': 'none',
       'Accept-Language': 'en-US,en;q=0.8',
       'Connection': 'keep-alive'}

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
            return keepTrying(url,counter+1)
    except:
        print 'Error'
        return keepTrying(url,counter+1)


import sqlite3
def main():
    sqlite_file = 'my_db.sqlite'
    conn = sqlite3.connect(sqlite_file)
    c = conn.cursor()

    #get all product links for Meijer
    all_links = c.execute("select url from stocks where store_ID = 1")
    all_links = list(all_links)

    for i,link in enumerate(all_links):

        #if i <= 7630: #use this if you want to continue from a specific point
        #    continue
        link = link[0]
        print i,link,
        req = urllib2.Request(link, headers=hdr)
        soup = keepTrying(req,1)
        
        cals_soup = soup(id = "calories")
        if cals_soup:
            calories = cals_soup[0].span.text
            try:
                calories = int(calories)
                print calories,
                c.execute("update stocks set calories=%d where url='%s';" % (calories,link))
                
            except:
                continue
        print
    conn.commit()
    conn.close()

if __name__ === "__main__":
    main()