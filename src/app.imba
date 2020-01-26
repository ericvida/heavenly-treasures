import {treasures} from './data'
import './components/app-footer'
import './components/person-card'
import './components/header'
import './components/progress-bar'

tag heavenly-treasures
	def render
		<self.layout-container>
			<ul> for item in treasures
			<div.content-wrapper>
				<app-header>
				<section.parent>
					<aside> 
						<div.sticky> 
							for item in treasures
								<a.img__container href="#{item.name}">
									<img src="./images/{item.name}.jpg"> 
						
					<main.cards> for item in treasures
						<person-card#{item.name} data=item>
					<section.welcome>
						<div.sticky> 
							<h3> "Welcome to heavenly treasures"
							<p> "These are our friends in cambodia."
							<p> "They are regular attendees to our church group. They are either baptized believers in Jesus or sympathetic towards the Gospel. We know that sharing the gospel means more than praying with and preaching to someone. The gospel also meets the deepest needs of the people."
							<p> "In the last several months we have received gifts to support our friends in need, through our families. and your gifts made a huge impact on our friends' lives." 
							<p> "I made this website, to simply have a place to give you account of hour your funds are used."
							<p> "We would like to also inform you of other needs you might be interested in supporting."
							<p> "If you would like to send us funds to help these people, you can do so through our family members, or email us at tiradomission at gmail dot com."
							<p> "Sending money through an organization means that some of your funds will be used for operational costs, and usually a non-profit accept funds sent to a specific individual."
							<p> "We are NOT a non-profit. We cannot provide tax-deductible receipts. But we will make sure that 100% of your donation is used to help these."
							<p> "If needed, we will personally pay for any transaction fee from our personal income, as we are also personally invested in supporting our friends."
							<p> "This is completely based on trust, we are assuming that you are supporting, because you know us, or because you know our family."
							<p> "We take no funds for ourselves from your direct giving. We have a salary from an organization (Adventist Frontier Missions) and all our needs our met. If you would like to support our personal fundraising goals, please do so at afmonline.org."
				
			<app-footer>


### css
:root {
--first: #f4d35d;;
--second: #9fd356;
--third: #0B7A75;
--fourth: #684756;
--gray: #f0f0f0;
--dark: #626262;
--black: #232324;
--white: #fafffd;
--spacing: 10px;
--heading: 'Noto Serif', serif;
--body: 'Open Sans', sans-serif;
}

* {
	box-sizing: border-box;
	padding: 0;
	margin: 0;
	scroll-behavior: smooth;
}
html {
	scroll-behavior: smooth;
}
body {
	background-color: var(--dark)
}
body * {
	margin: 0;
}
.content-wrapper {
	max-width: 1200px;
	margin: 0 auto;
	background-color: var(--gray)
}
h1,h2,h3,h4,h5,h6 {
	font-family: 'Noto Serif', serif;
	font-weight: bold;
	color: var(--third)
}
p, div, span {
	font-family: 'Open Sans', sans-serif;
}
p {
	margin-bottom: var(--spacing);
}

a {
	color: var(--fourth);
}
### 
### css scoped

.parent {
	background-color: var(--gray);
	display: grid;
	padding: 10px;
	grid-template-columns: minmax(100px, 200px) minmax(300px, 1fr) 300px;
	grid-template-rows: 1fr;
	grid-column-gap: 10px;
	grid-row-gap: 10px;
	position: relative;
}
.welcome {
	padding: var(--spacing);
	background-color: white;
	position: sticky;
	font-size: .8rem;
}

aside { 
	grid-area: 1 / 1 / 6 / 2;
}

.sticky {
	position: sticky;
	top: 0;
}
.img__container {
	width: 100%;
	display: block;
	height: auto;
	position: relative;
	overflow: hidden;
	padding: 55% 0 0 0;
}
.img__container img {
	display: block;
	width: 100%;
	height: auto;
	position: absolute;
	top: 0;
	left: 0;
}
main {
	scroll-behavior: smooth;
	display: grid;
}

.cards {
}

###