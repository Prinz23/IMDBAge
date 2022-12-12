/*  IMDBAge v2.22 - Greasemonkey script to add actors ages to IMDB pages
    Copyright (C) 2005-2020 Thomas Stewart <thomas@stewarts.org.uk>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Inspired in 2001, Created on 24/03/2005, Last Changed 28/12/2020
    Major bug fixes and improvements by Christopher J. Madsen

    This is a Greasemonkey user script, see http://www.greasespot.net/ and
    https://addons.mozilla.org/firefox/addon/748

    New versions can be found on the following sites:
    https://stewarts.org.uk/project/imdbage/
    http://userscripts.org/scripts/show/1060 (dead)
    https://greasyfork.org/scripts/2798-imdbage
    https://monkeyguts.com/code.php?id=268 (dead)
    https://openuserjs.org/scripts/thomas_d_stewart/IMDBAge
    https://github.com/thomasdstewart/IMDBAge

    This script adds the age and other various info onto IMDB pages.
    Specifically it adds some details to actor or actresses pages. It adds
    their age, their Tropical Zodiac Sign and their Chinese Zodiac Sign. As
    well as adding how many years ago and how old they were when they made the
    listed films. It also adds how long a go a film was made on a film page.

    This script is not abandoned, email thomas@stewarts.org.uk if it breaks.

    Changelog
    * 2.22 add fallback function for older browsers (chinese zodiac)
    * 2.21 make code compatible with older browsers, some don't support chinese calendar = no chinese zodiac
    * 2.20 fix tv series that have end year in the future
    * 2.19 add age range for tv series apperences
    * 2.18 add chinese sign icons
    * 2.17 fix month calculation
    * 2.16 fix chinese signs
    * 2.15 adapted to new layout
    * 2.14 fixed icon, improved getNameDates, new style fixes, reformating
    * 2.13 added https urls, removed scriptvals, fixed title pages
    * 2.12 fixed adding ages to individual films and fixed old style
    * 2.11 fixed date grabbing again
    * 2.10 fixed date grabbing
    * 2.9 fixed adding year to title with many years
    * 2.8 old style working, fixed death day for new style, improved year grabbing
    * 2.7 added persistent config, changed namespace
    * 2.6 fixed star signs and added unicode symbols
    * 2.5 fixed imdb updates
    * 2.4 fixed imdb updates
    * 2.3 improved year grabbing
    * 2.2 updated imdb text info, formatting, added ages to individual films
    * 2.1 Major changes, added signs, added config
    * 1.6 Added improvement ideas from Christopher J. Madsen, Added first imdb text files search, reformatting
    * 1.5 Removed function enclosing while script
    * 1.3 First public version
*/

var doNameAge  = true;
var doNameAges = true;
var doSigns    = true;
var doFilmAge  = true;

// ==UserScript==
// @name        IMDBAge
// @description Adds the age and other various info onto IMDB pages.
// @version     2.22
// @author      Prinz23
// @namespace   http://www.stewarts.org.uk
// @include     http*://*imdb.com/name/*
// @include     http*://*imdb.com/title/*
// @require  http://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @homepageURL https://github.com/Prinz23/IMDBAge/
// @downloadURL https://github.com/Prinz23/IMDBAge/raw/master/IMDBAge.user.js
// @icon        https://stewarts.org.uk/project/imdbage/icon.png
// @license GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

/*
(https://secure.imdb.com/register-imdb/siteprefs)
Title Test Cases:
plain year              https://www.imdb.com/title/tt0056172/
year range              https://www.imdb.com/title/tt0108757/
year range still open   https://www.imdb.com/title/tt0944947/
year with version       https://www.imdb.com/title/tt1008690/ (dead)

Name Test Cases: (In full for completeness)
Born 18C -> Died 18C    https://www.imdb.com/name/nm1038177/ (Laurence Sterne 54)
Born 18C -> Died 19C    https://www.imdb.com/name/nm0308075/ (Almeida Garrett 55)
Born 18C -> Died 20C    None
Born 18C -> Died 21C    None
Born 18C -> Alive       None

Born 19C -> Died 19C    https://www.imdb.com/name/nm0786564/ (Anna Sewell 58)
Born 19C -> Died 20C    https://www.imdb.com/name/nm0186440/ (Ward Crane 38)
Born 19C -> Died 21C    https://www.imdb.com/name/nm0041807/ (Germaine Auger 112)
Born 19C -> Alive       https://www.imdb.com/name/nm0008724/ (Dawlad Abiad 118)

Born 20C -> Died 20C    https://www.imdb.com/name/nm0001006/ (John Candy 43)
Born 20C -> Died 21C    https://www.imdb.com/name/nm0670239/ (John Peel 65)
Born 20C -> Alive       https://www.imdb.com/name/nm0088127/ (Alexis Bledel 36)

Born 21C -> Died 21C    https://www.imdb.com/name/nm2548643/ (Tabea Block 1)
Born 21C -> Alive       https://www.imdb.com/name/nm1468628/ (Ben Want 15)

Born 31 Dec 1969        https://www.imdb.com/name/nm1009503/ (Taylor McCall 48)
Died 31 Dec 1969        https://www.imdb.com/name/nm0862239/ (Carol Thurston 49)
Born  1 Jan 1970        https://www.imdb.com/name/nm0231191/ (Fiona Dolman 48)
Died  1 Jan 1970        https://www.imdb.com/name/nm0902025/ (Eduard von Borsody 71)

http://us.imdb.com/date/{month}-{day}
http://us.imdb.com/search/name?birth_year={year}

$ curl https://datasets.imdbws.com/name.basics.tsv.gz | gunzip > name.basics.tsv
$ for c in 17 18 19 20; do awk -F'\t' '{print $3 " " $1}' name.basics.tsv | grep ^$c | awk '{print $2}' > b.$c; awk -F'\t' '{print $4 " " $1}' name.basics.tsv | grep ^$c | awk '{print $2}' > d.$c; done
$ cat b.17 d.17 | sort | uniq -d #list of people born and died in 18C
$ wc -l b.17 d.17 b.18 d.18 b.19 d.19 b.20 d.20
    353 b.17
    137 d.17
  37757 b.18
    921 d.18
 471993 b.19
  96672 d.19
   4516 b.20
  86201 d.20
 698550 total
$

*/

/*
TODO: add ages to individual ages of actors to a film page, very hard,
        http req for each one, and then a xpath on the whole result
TODO: add script updater support
*/

var chineseYears = {
        1800 :[1, 25],
        1801 :[2, 13],
        1802 :[2, 3],
        1803 :[1, 23],
        1804 :[2, 11],
        1805 :[1, 31],
        1806 :[2, 18],
        1807 :[2, 7],
        1808 :[1, 28],
        1809 :[2, 14],
        1810 :[2, 4],
        1811 :[1, 25],
        1812 :[2, 13],
        1813 :[2, 1],
        1814 :[1, 21],
        1815 :[2, 9],
        1816 :[1, 29],
        1817 :[2, 16],
        1818 :[2, 5],
        1819 :[1, 26],
        1820 :[2, 14],
        1821 :[2, 3],
        1822 :[1, 23],
        1823 :[2, 11],
        1824 :[1, 31],
        1825 :[2, 18],
        1826 :[2, 7],
        1827 :[1, 27],
        1828 :[2, 15],
        1829 :[2, 4],
        1830 :[1, 25],
        1831 :[2, 13],
        1832 :[2, 2],
        1833 :[2, 20],
        1834 :[2, 9],
        1835 :[1, 29],
        1836 :[2, 17],
        1837 :[2, 5],
        1838 :[1, 26],
        1839 :[2, 14],
        1840 :[2, 3],
        1841 :[1, 23],
        1842 :[2, 10],
        1843 :[1, 30],
        1844 :[2, 18],
        1845 :[2, 7],
        1846 :[1, 27],
        1847 :[2, 15],
        1848 :[2, 5],
        1849 :[1, 24],
        1850 :[2, 12],
        1851 :[2, 1],
        1852 :[2, 20],
        1853 :[2, 8],
        1854 :[1, 29],
        1855 :[2, 17],
        1856 :[2, 6],
        1857 :[1, 26],
        1858 :[2, 14],
        1859 :[2, 3],
        1860 :[1, 23],
        1861 :[2, 10],
        1862 :[1, 30],
        1863 :[2, 18],
        1864 :[2, 8],
        1865 :[1, 27],
        1866 :[2, 15],
        1867 :[2, 5],
        1868 :[1, 25],
        1869 :[2, 11],
        1870 :[1, 31],
        1871 :[2, 19],
        1872 :[2, 9],
        1873 :[1, 29],
        1874 :[2, 17],
        1875 :[2, 6],
        1876 :[1, 26],
        1877 :[2, 13],
        1878 :[2, 2],
        1879 :[1, 22],
        1880 :[2, 10],
        1881 :[1, 30],
        1882 :[2, 18],
        1883 :[2, 8],
        1884 :[1, 28],
        1885 :[2, 15],
        1886 :[2, 4],
        1887 :[1, 24],
        1888 :[2, 12],
        1889 :[1, 31],
        1890 :[1, 21],
        1891 :[2, 9],
        1892 :[1, 30],
        1893 :[2, 17],
        1894 :[2, 6],
        1895 :[1, 26],
        1896 :[2, 13],
        1897 :[2, 2],
        1898 :[1, 22],
        1899 :[2, 10],
        1900 :[1, 31],
        1901 :[2, 19],
        1902 :[2, 8],
        1903 :[1, 29],
        1904 :[2, 16],
        1905 :[2, 4],
        1906 :[1, 25],
        1907 :[2, 13],
        1908 :[2, 2],
        1909 :[1, 22],
        1910 :[2, 10],
        1911 :[1, 30],
        1912 :[2, 18],
        1913 :[2, 6],
        1914 :[1, 26],
        1915 :[2, 14],
        1916 :[2, 3],
        1917 :[1, 23],
        1918 :[2, 11],
        1919 :[2, 1],
        1920 :[2, 20],
        1921 :[2, 8],
        1922 :[1, 28],
        1923 :[2, 16],
        1924 :[2, 5],
        1925 :[1, 24],
        1926 :[2, 13],
        1927 :[2, 2],
        1928 :[1, 23],
        1929 :[2, 10],
        1930 :[1, 30],
        1931 :[2, 17],
        1932 :[2, 6],
        1933 :[1, 26],
        1934 :[2, 14],
        1935 :[2, 4],
        1936 :[1, 24],
        1937 :[2, 11],
        1938 :[1, 31],
        1939 :[2, 19],
        1940 :[2, 8],
        1941 :[1, 27],
        1942 :[2, 15],
        1943 :[2, 4],
        1944 :[1, 25],
        1945 :[2, 13],
        1946 :[2, 1],
        1947 :[1, 22],
        1948 :[2, 10],
        1949 :[1, 29],
        1950 :[2, 17],
        1951 :[2, 6],
        1952 :[1, 27],
        1953 :[2, 14],
        1954 :[2, 3],
        1955 :[1, 24],
        1956 :[2, 12],
        1957 :[1, 31],
        1958 :[2, 18],
        1959 :[2, 8],
        1960 :[1, 28],
        1961 :[2, 15],
        1962 :[2, 5],
        1963 :[1, 25],
        1964 :[2, 13],
        1965 :[2, 2],
        1966 :[1, 21],
        1967 :[2, 9],
        1968 :[1, 30],
        1969 :[2, 17],
        1970 :[2, 6],
        1971 :[1, 27],
        1972 :[2, 15],
        1973 :[2, 3],
        1974 :[1, 23],
        1975 :[2, 11],
        1976 :[1, 31],
        1977 :[2, 18],
        1978 :[2, 7],
        1979 :[1, 28],
        1980 :[2, 16],
        1981 :[2, 5],
        1982 :[1, 25],
        1983 :[2, 13],
        1984 :[2, 2],
        1985 :[2, 20],
        1986 :[2, 9],
        1987 :[1, 29],
        1988 :[2, 17],
        1989 :[2, 6],
        1990 :[1, 27],
        1991 :[2, 15],
        1992 :[2, 4],
        1993 :[1, 23],
        1994 :[2, 10],
        1995 :[1, 31],
        1996 :[2, 19],
        1997 :[2, 7],
        1998 :[1, 28],
        1999 :[2, 16],
        2000 :[2, 5],
        2001 :[1, 24],
        2002 :[2, 12],
        2003 :[2, 1],
        2004 :[1, 22],
        2005 :[2, 9],
        2006 :[1, 29],
        2007 :[2, 18],
        2008 :[2, 7],
        2009 :[1, 26],
        2010 :[2, 14],
        2011 :[2, 3],
        2012 :[1, 23],
        2013 :[2, 10],
        2014 :[1, 31],
        2015 :[2, 19],
        2016 :[2, 8],
        2017 :[1, 28],
        2018 :[2, 16],
        2019 :[2, 5],
        2020 :[1, 25],
        2021 :[2, 12],
        2022 :[2, 1],
        2023 :[1, 22],
        2024 :[2, 10],
        2025 :[1, 29],
        2026 :[2, 17],
        2027 :[2, 6],
        2028 :[1, 26],
        2029 :[2, 13],
        2030 :[2, 3],
        2031 :[1, 23],
        2032 :[2, 11],
        2033 :[1, 31],
        2034 :[2, 19],
        2035 :[2, 8],
        2036 :[1, 28],
        2037 :[2, 15],
        2038 :[2, 4],
        2039 :[1, 24],
        2040 :[2, 12],
        2041 :[2, 1],
        2042 :[1, 22],
        2043 :[2, 10],
        2044 :[1, 30],
        2045 :[2, 17],
        2046 :[2, 6],
        2047 :[1, 26],
        2048 :[2, 14],
        2049 :[2, 2],
        2050 :[1, 23],
        2051 :[2, 11],
        2052 :[2, 1],
        2053 :[2, 19],
        2054 :[2, 8],
        2055 :[1, 28],
        2056 :[2, 15],
        2057 :[2, 4],
        2058 :[1, 24],
        2059 :[2, 12],
        2060 :[2, 2],
        2061 :[1, 21],
        2062 :[2, 9],
        2063 :[1, 29],
        2064 :[2, 17],
        2065 :[2, 5],
        2066 :[1, 26],
        2067 :[2, 14],
        2068 :[2, 3],
        2069 :[1, 23],
        2070 :[2, 11],
        2071 :[1, 31],
        2072 :[2, 19],
        2073 :[2, 7],
        2074 :[1, 27],
        2075 :[2, 15],
        2076 :[2, 5],
        2077 :[1, 24],
        2078 :[2, 12],
        2079 :[2, 2],
        2080 :[1, 22],
        2081 :[2, 9],
        2082 :[1, 29],
        2083 :[2, 17],
        2084 :[2, 6],
        2085 :[1, 26],
        2086 :[2, 14],
        2087 :[2, 3],
        2088 :[1, 24],
        2089 :[2, 10],
        2090 :[1, 30],
        2091 :[2, 18],
        2092 :[2, 7],
        2093 :[1, 27],
        2094 :[2, 15],
        2095 :[2, 5],
        2096 :[1, 25],
        2097 :[2, 12],
        2098 :[2, 1],
        2099 :[1, 21]
}


class ZodiacSign {
		constructor(value, lang = 'en') {
			this.sign = ''
			this.chinese = ''

			if (!Object.prototype.hasOwnProperty(ZodiacSign.signs, lang)) lang = 'en'
			if (!isNaN(Date.parse(value))){
				this.sign = this.getSign(value, lang)
				this.chinese = this.getChineseSign(value, lang)
			}
		}

		getSign(x, y) {
			return `${ZodiacSign.signs[y][Number(new Intl.DateTimeFormat('fr-TN-u-ca-persian', {month: 'numeric'}).format(Date.parse(x))) - 1]} - ${ZodiacSign.signs['icon'][Number(new Intl.DateTimeFormat('fr-TN-u-ca-persian', {month: 'numeric'}).format(Date.parse(x))) - 1]}`;
		}

		getChineseSign(x, y){
			let chineseDate = new Intl.DateTimeFormat('fr-TN-u-ca-chinese', {day: '2-digit', month: 'long', year:'numeric'}).format(Date.parse(x)).substring(0, 4)
			// fallback for browser that don't correctly support chinese calendar
			if (chineseDate.search("[1-2][0-9]{3}") === -1) {
			var cy = x.getFullYear()
				var cd = chineseYears[cy];
				if (chineseYears[cy] !== undefined) {
					if (x < new Date(cy, cd[0] - 1, cd[1])) {
						cy--;
					}
					chineseDate = new String(cy);
				}
			}
			return `${ZodiacSign.chineseSigns[y][+chineseDate % 12]} - ${ZodiacSign.chineseSigns['icon'][+chineseDate % 12]} (${ZodiacSign.chineseElements[y][Math.floor(+chineseDate.charAt(3) / 2)]})`
		}

}
ZodiacSign.signs = {
			en : ['Aries: The Ram','Taurus: The Bull','Gemini: The Twins','Cancer: The Crab','Leo: The Lion','Virgo: The Virgin','Libra: The Scales','Scorpio: The Scorpion','Sagittarius: The Archer','Capricorn: The Goat','Aquarius: The Water Bearer','Pisces: The Fish'],
			fr : ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Vereau', 'Poissons'],
			es : ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
			ar : ['الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء', 'الميزان', 'العقرب',' القوس', 'الجدي', 'الدلو', 'الحوت'],
			ua : ['Овен', 'Телець', 'Близнята', 'Рак', 'Лев', 'Діва', 'Терези', 'Скорпіон', 'Стрілець', 'Козоріг', 'Водолій', 'Риби'],
			icon : ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
		}

ZodiacSign.chineseSigns = {
			en : ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Sheep'],
			fr : ['Singe', 'Coq', 'Chien', 'Cochon', 'Rat', 'Bœuf', 'Tigre', 'Lapin', 'Dragon', 'Serpent', 'Cheval', 'Mouton'],
			es : ['Mono', 'Gallo', 'Perro', 'Cerdo', 'Rata', 'Buey', 'Tigre', 'Conejo', 'Dragón', 'Serpiente', 'Caballo', 'Oveja'],
			ar : ['القرد', 'الديك', 'الكلب', 'الخنزير', 'الفأر', 'الثور', 'النمر', 'الأرنب', 'التنين', 'الثعبان', 'الحصان', 'الخروف'],
			ua : ['Мавпа', 'Півень', 'Собака', 'Свиня', 'Щур', 'Бик', 'Тигр', 'Кролик', 'Дракон', 'Змія', 'Кінь', 'Вівця'],
			icon : ['🐒', '🐓', '🐕', '🐖', '🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐏']
		}

ZodiacSign.chineseElements = {
			en : ['Metal', 'Water', 'Wood', 'Fire', 'Earth'],
			fr : ['Métal', 'Eau', 'Bois', 'Feu', 'Terre'],
			es : ['Metal', 'Agua', 'Madera', 'Fuego', 'Tierra'],
			ar : ['المعدني', 'المائي', 'الخشبي', 'الناري', 'الأرضي'],
			ua : ['Метал', 'Вода', 'Дерево', 'Вогонь', 'Земля']
		}

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
    that detects and handles AJAXed content.

    IMPORTANT: This function requires your script to have loaded jQuery.
*/
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}


/* get dates from a name page
input: born and died called by ref, they are filled with dates from the page
returns: whether they are dead or alive */
function getNameDates(born, died) {
        var alive = true;

        var bdata = JSON.parse(document.getElementById('__NEXT_DATA__').textContent)['props']['pageProps']['mainColumnData']['birthDate'];
        if (bdata) {
          var bd = bdata['dateComponents'];
          if (bd['month'] === null || bd['day'] == null){
            justyear = true;
          }
          born.setFullYear(bd['year']);
          born.setMonth(bd['month'] - 1);
          born.setDate(bd['day']);
        }
        var ddata = JSON.parse(document.getElementById('__NEXT_DATA__').textContent)['props']['pageProps']['mainColumnData']['deathDate'];
        if (ddata){
          alive = false;
          var dd = ddata['dateComponents'];
          died.setFullYear(dd['year']);
          died.setMonth(dd['month'] - 1);
          died.setDate(dd['day']);

        }

        //alert("Born: " + born + "\nDied: " + died + "\nAlive: " + alive);
        return alive;
}

/* get dates from a title page
input: none
returns: date of title */
function getTitleDates() {
        var nodes = document.evaluate("//h4[text()='Release Date:']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (nodes.snapshotLength == 1) {
                date = nodes.snapshotItem(0).nextSibling.textContent;
        }

        var nodes = document.evaluate("//a[text()='Release date']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (nodes.snapshotLength == 1) {
                date = nodes.snapshotItem(0).nextSibling.textContent;
        }

        titledate = new Date(Date.parse(date));

        //alert("Year: " + titledate.getFullYear())
        return titledate;
}

/* add age of person to page
input: alive status, and dates
returns: none */
function addAge(alive, years, months) {
        // if age is unknown exit
        if (years < 1) {
          return
        }

        /* only count months if we found month & day info */
        var p1 = document.createElement("p");
        p1.classList.add('age-textbox');
        var container = document.createTextNode(
                " (Age: " + years + " year" + (years == 1 ? '' : 's') +
                (!justyear ? ", " + months + " month" + (months == 1 ? '' : 's') : '') + ")");
        p1.appendChild(container);

        /* loop over all dates */
        if (alive == true) {
                node = document.querySelectorAll("[data-testid='hero__pageTitle']")[0];
                node.parentNode.insertBefore(p1, node.nextSibling);
        } else {
                node = document.querySelectorAll("[data-testid='hero__pageTitle']")[0];

                node.parentNode.insertBefore(p1, node.nextSibling);
        }
}

/* add age of film and the age of the actor when they were in the film
input: date
returns: none */
function addAges(born) {
        //find all the films, this in includes things like producer and writer
        var nodes = document.evaluate("//div[contains(@class, 'ipc-metadata-list-summary-item__cc')]//label[contains(@class,'ipc-metadata-list-summary-item__li')]",
                                      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        //loop round each film
        for (var i = 0; i < nodes.snapshotLength; i++) {
                var node = nodes.snapshotItem(i);
                // on pressing "see all" skip already added age entries
                if (node.classList.contains('relative_age')){
                        continue;
                }
                //extract the year of the film depending on style
                var yearindex = node.innerHTML.search("[1-2][0-9]{3}")
                var yearmatches = node.innerHTML.match(/[1-2][0-9]{3}/g);
                //if we don't find a year, continue with for loop
                if (yearmatches === null) {
                        continue;
                }
                var filmborn = yearmatches[0];
                //alert(filmborn);

                //calculate ages
                var filmage = new Date().getFullYear() - filmborn;
                if (yearmatches.length == 2 && yearmatches[0] != yearmatches[1]) {
                        var age = filmborn - born;
                        var age2 = yearmatches[1] - born;
                        age = new String(age + " - " + age2 + " years old");
                } else {
                        var age = filmborn - born;
                        age = new String(age +
                                " year" + (age == 1 ? '' : 's') + " old");
                }

                if (yearmatches.length == 2 && yearmatches[0] != yearmatches[1]) {
                        var endfilmage = new Date().getFullYear() - yearmatches[1];
                        if (endfilmage < 0) {
                                if (filmage == 0) {
                                        var startage = new String("this year");
                                } else {
                                        var startage = new String(Math.abs(filmage) + " year" + (Math.abs(filmage) == 1 ? '' : 's') + " ago");
                                }
                                var agetxt = new String(startage + " and ongoing while " + age);
                        } else {
                                var agetxt = new String(Math.abs(endfilmage) + " - " + Math.abs(filmage) + " years ago while " + age);
                        }
                } else {
                        //get them in a nice format
                        if (filmage < 0) {
                                var agetxt = new String(
                                        "in " +
                                        Math.abs(filmage) + " year" +
                                        (Math.abs(filmage) == 1 ? '' : 's') +
                                        " will be " + age);
                        }
                        if (filmage == 0) {
                                var agetxt = new String(
                                        "this year while " + age);
                        }
                        if (filmage > 0) {
                                var agetxt = new String(
                                        Math.abs(filmage) + " year" +
                                        (Math.abs(filmage) == 1 ? '' : 's') +
                                        " ago while " + age);
                        }
                }

                //if(i == 4) { alert(agetxt); }
                /* add in age text */
                node.innerHTML = node.innerHTML.substring(0,yearindex)
                        + agetxt + ", " + node.innerHTML.substring(yearindex)
                node.classList.add('relative_age');
        }
}

/* adds signs to page
input: date person is born
returns: none */
function addSigns(born) {
        /* make a node with info in */
        var csign = new ZodiacSign(born);
        // some older browsers don't support the chinese calendar
        if (csign.chinese.indexOf("undefined") === -1){
              var chstr = ", Chinese Zodiac Sign: " +  csign.chinese;
        } else {
              var chstr = "";
        }

        var container = document.createTextNode(
                "Tropical Zodiac Sign: " + csign.sign + chstr
                );
        var p1 = document.createElement("p");
        p1.appendChild(container);

        /* find place to stick the info */
        var node = document.getElementsByClassName("age-textbox")[0];

        /* attach it */
        node.parentNode.insertBefore(p1, node.nextSibling);
}

/* add the age of the film to the page
input: date of film
returns: none */
function addFilmAge(filmAge) {
        /* calc age */
        var age = new Date().getFullYear() - filmAge.getFullYear();

        /* only print if age is 1 or over */
        if (age >= 1) {
                /* make a node with info in */
                var container = document.createTextNode(", " +
                        age +
                        " year" + (age == 1 ? '' : 's') +
                        " ago");
        }
        if (age == 0) {
                var container = document.createTextNode(", This year");
        }
        if (age <= -1) {
                var container = document.createTextNode(", in " +
                        Math.abs(age) +
                        " year" + (Math.abs(age) == 1 ? '' : 's'));
        }

        /* find place to stick the info */
        var node = document.querySelectorAll("[data-testid='title-details-releasedate'] li")[0]

        /* create new span with formatting to match */
        var span = document.createElement('span');
        //span.style.fontSize = "11px";
        span.appendChild(container);

        /* attach it */
        node.parentNode.insertBefore(span, node.nextSibling);
}


function getAge(birthDate, diedDate)
{
    if (alive){
      var today = new Date();
    } else {
      var today = diedDate;
    }

    var age_calc = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
    {
        age_calc--;
    }
    if (today.getDate() < birthDate.getDate()) {
        m--;
    }
    if (m < 0) {
        m += 12;
    }
    return [age_calc, m];
}


/* code starts, two options, either it is a name page ... */
if (window.location.href.indexOf('name') != -1) {
        var born = new Date();
        var died = new Date();
        var justyear = false;
        /* get needed dates */
        var alive = getNameDates(born, died);
        /* convert difference into years */
        age_tmp = getAge(born, died);
        var age = age_tmp[0];
        var age_months = age_tmp[1];

        if (age > 0){

              /* add wanted bits */
              if(doNameAge == true) {
                      addAge(alive, age, age_months);
              }
              if(doSigns == true) {
                      addSigns(born);
              }
              if(doNameAges == true) {
                      addAges(born.getFullYear());
              }


              function addNewAges(jNode){
                addAges(born.getFullYear());
              }
              // add callback when see all is pressed
              waitForKeyElements('.ipc-metadata-list-summary-item__c', addNewAges);
        }

/* ... or it is a title page */
} else if (window.location.href.indexOf('title') != -1) {
        /* get needed dates */
        filmAge = getTitleDates();

        /* add wanted bits */
        if(doFilmAge == true && typeof(filmAge) == "object") {
                addFilmAge(filmAge);
        }
}


