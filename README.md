## phoenix-sync

This is a tool to let developers sync a contentful space from one to another.

## dev setup

This project requires Node JS & NPM installed locally.

```sh
$ git clone https://github.com/dosomething/phoenix-sync
$ npm install
$ cp .env.example .env
```

## cli usage

```sh
# Migrate prod content to the staging space
$ npm run staging

# Migrate prod content to your developer space
$ npm run developer
```

## automatic staging updates

For use on a server, syncs the staging space anytime a change is published in production.

```sh
$ npm run auto-update
```
