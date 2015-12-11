from bs4 import BeautifulSoup
import urllib2
import time
import re

def getProductsInfo(soup,category=None):
    
    result = []
    quit_this_category = False
    
    
    product_soups = soup.find_all("div", class_="js-tile tile-grid-unit")
    for psoup in product_soups:
        product = psoup.find("a", class_="js-product-title")
        product_link = product['href']
        product_name = product.text.strip()

        product_price = psoup.find("span", attrs={"class":"price-display"})
        
        if product_price and product_price.text != ' ':
            price = product_price.text
            if ',' in price:
                price = ''.join(price.split(','))
            try:
                product_price = float(price.strip()[1:])
                result.append((product_name,product_price,product_link,category))
            except:
                pass

            
        else:
            return result,True
            z = psoup.find("span", attrs={"class":"in-store-only"})
            
            if z.text.strip() == u'In stores only':
                #this means there are no further prices available! 
                quit_this_category = True #tell main program to switch categories
                break
        
        
    return result,quit_this_category
    

def printPartialResults(results):
    for pname,pprice,plink,cat in results[:1]:
        print "%s, $%.2f, %s" % (pname,pprice,cat)
        print "Link: %s" % "http://www.walmart.com"+plink
        print
        
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
            keepTrying(url,counter+1)
    except:
        print 'Error'
        keepTrying(url,counter+1)

def main():
	#First, get the links for each food category in the Food section
	url = "http://www.walmart.com/cp/food/976759"
	req = requests.get(url, headers=user_agent)
	page = urllib2.urlopen(url)
	soup = BeautifulSoup(page, 'html.parser')
	linksToFoodType = soup.find_all("a", class_='lhn-menu-toggle lhn-menu-arrow')
	food_links = []
	for foodType in linksToFoodType:
	    subTypes = soup.find_all("a", attrs={"data-uid": re.compile("^" + foodType['data-target-id'] + "")})
	    for s in subTypes:
	        if '/food/' in s['href']:
	            food_links.append(s['href'])

	domain = "http://www.walmart.com"

	products_info = []
	counter = 35
	total_cats = len(food_links)

	for food_link in food_links[35:]:
	    quit = False
	    
	    #open each food-subtype page and print out fraction of categories visited
	    counter += 1
	    url = domain+food_link

	    print '%d/%d' % (counter,total_cats)
	    print 'Opening',url
	    
	    page = keepTrying(url,1)
	    
	    #parse out current category name
	    url_pieces = food_link.split('/')

	    food_i = url_pieces.index('food')

	    current_cat = url_pieces[food_i+1]
	    current_cat = ' '.join(current_cat.split('-')).title()
	        

	    soup = BeautifulSoup(page, 'html.parser')
	    #print 'Soup:',soup.prettify()[:25]

	    
	    print 'OK. Getting links...'
	    res,quit = getProductsInfo(soup,current_cat)
	    printPartialResults(res)
	    products_info += res
	    
	    if quit:#go to next food category
	        continue
	    
	    
	    #get the number of the last page under this category
	    pages = soup.find_all(href=re.compile("^\?page="))
	    #example:
	    #<a href="?page=6&amp;cat_id=976759_976787_1001390">6</a>
	    #...
	    #<a href="?page=25&amp;cat_id=976759_976787_1001390">25</a>
	    last_page = 0
	    if pages:
	        #get the suffix for the pages urls
	        page_link = str(pages[0])
	        start = page_link.find('&amp')
	        end = page_link.find('">')
	        suffix = page_link[start:end]
	        
	        for p in pages:
	            try:
	                page_number = int(p.string)
	                last_page = max(last_page,page_number)


	            except:
	                pass
	        print 'Last page =',last_page
	        for page_number in range(2,last_page+1):
	            
	            page_url = url+"?page="+str(page_number)+suffix
	            print 'Opening',page_url
	            
	            page = keepTrying(page_url,1)

	            soup = BeautifulSoup(page, 'html.parser')
	            #print 'Soup:',soup.prettify()[:25]
	            print 'OK. Getting links...'

	            res,quit = getProductsInfo(soup,current_cat)
	            printPartialResults(res)      
	            products_info += res

	            if quit:#switch to next category
	                break

if __name__ === "__main__":
	main()