import './progress-bar'

tag person-card
	@sumGoal = 0
	@sumDonations = 0
	@progress = 0
	def render
		<self.card>
			# sum donations
			for item in @data.needs
				@sumGoal += item.price
			# sum donations
			for item in @data.donors
				@sumDonations += item.donation
			# calculate progress
			@progress = Math.floor @sumDonations / @sumGoal * 100
			<div.card__image-container>
				<img src="./images/"+@data.name+".jpg" href="person image">
			<progress-bar data=@progress >
			<div.card__content>
				<h1.card__title> @data.name
				<div.story> 
					# Loop through story paragraphs
					for item in @data.story
						<p> item
				<div.needs>
					<h3> "{@data.name}'s needs"
					<ul>
						# Loop to items person needs
						for item in @data.needs
							# If project is completed add class of yes.
							if item.done is yes
								<li.done> 
									<b> "$"+ item.price + " "
									<span> item.name
							else
								<li> 
									<b> "$"+ item.price + " "
									<span> item.name
					<b> "Total Goal: "
					<span> "$"+@sumGoal
				<div.card__donors>
					<h3> "Donors"
					<div>
						# List donor initials and amounts
						for item in @data.donors
							<span> item.name.match(/\b(\w)/g).join('.').toUpperCase() + ". $" + item.donation + ", "
					<p> 
						# show total donations of donors
						<b> "Total Donations: "
						<span> "$"+@sumDonations

				<a.button href="mailto:tiradomission@gmail.com?subject=I would like to support {@data.name.charAt(0).toUpperCase() + @data.name.slice(1)}!&body=Hello my name is NAME,%0D%0AI would like to support {@data.name} with AMOUNT." > "SUPPORT {@data.name.toUpperCase()} DIRECTLY"	
### css
.card {
	display: flex;
	flex-direction: column;
	background-color: var(--white);
	cursor: pointer;
	transition: all 0.3s ease 0s;
	margin-bottom: 20px;
}
.card__image-container {
	width: 100%;
	padding-top: 56.25%;
	overflow: hidden;
	position: relative;
}
.card__image-container img {
	width: 100%;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.card__content {
	padding: 20px;
}
.card__title {
	margin-bottom: 20px;
}
.card__info {
	display: flex;
	margin-bottom: 20px;
	align-self: end;
	align-items: center;
}
.done {
	text-decoration: line-through;
	color: var(--dark)
}
.story {
	border: var(--black) 1px solid;
	border-radius: var(--spacing);
	background-color: var(--white);
	padding: 30px;
	margin-bottom: 20px;
}
.needs {
	margin-bottom: 20px;
}
ul {
	padding-left: 20px;
}
.button {
	background-color: var(--first);
	padding: 5px 10px;
	border-radius: 5px;
	color: var(--dark);
	font-weight: bold;
	text-decoration: none;
	border: 1px solid var(--var(--dark));
	float: right;
}
.button:hover {
	background-color: var(--dark);
	color: var(--first);
}

###