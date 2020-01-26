
tag progress-bar
	def render
		<self.progress-bar>
			if @data > 1
				<div.progress css:width="{@data}%">
					<span> "{@data}%"
			else
				<div.progress.support> <span> "Support this Goal: 0%"

### css scoped
.progress-bar {
 width: 100%;
 background-color: var(--dark);
 font-family: var(--copy);
 font-weight: bold;
}
.progress {
	background-color: var(--first);
	text-align: center;
	padding: 5px;
	max-width: 100%;
}
.progress.support {
	background-color: var(--dark);
	color: var(--white);
}

###