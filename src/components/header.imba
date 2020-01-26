tag app-header < header
  def render
    <self.app-header>
      <nav> 
        <a href="/"> "home"
        <a href="mailto:tiradomission@gmail.com"> "donate"

### css
.app-header nav {
  background-color: var(--black);
  color: var(--white);
  display: flex;
  justify-content: space-around;
}
nav a {
  color: white;
  text-decoration: none;
  text-transform: uppercase;
  font-family: var(--heading);
}

.app-header nav a {
  padding: 15px;
  flex: 1fr;
}

.app-header nav a:hover {
  background-color: var(--dark);
  padding: 15px;
  flex: 1fr;
}

###
