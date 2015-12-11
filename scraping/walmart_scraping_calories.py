from bs4 import BeautifulSoup
import urllib2
import re

hdr = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
       'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
       'Accept-Encoding': 'none',
       'Accept-Language': 'en-US,en;q=0.8',
       'Connection': 'keep-alive'}
import time
def keepTrying(url,counter):
    print 'Try',counter
    if counter == 5:
        #let the error occur
        time.sleep(5)
        page = urllib2.urlopen(url)
        return page
    
    time.sleep(3)
    #req = requests.get(url, headers=user_agent)
    try:
        page = urllib2.urlopen(url)
        if page:
            return page
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
    #get all product links for Walmart
    all_links = c.execute("select url from stocks where store_ID = 0")
    all_links = list(all_links)

    for i,link in enumerate(all_links):

        link = link[0]
        print i,link,
        page = keepTrying(link,1)
        soup = BeautifulSoup(page, 'html.parser')
        
        try:
            calories = soup.find_all('table')[1].find("tbody").find("td").text
            calories = int(float(calories))
            print calories,
            c.execute("update stocks set calories=%d where url='%s';" % (calories,link))

        except:
            continue
        print
    conn.commit()
    conn.close()

if __name__ === "__main__":
    main()