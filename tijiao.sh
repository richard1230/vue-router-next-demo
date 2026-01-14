#!/bin/zsh

git add . &&
git commit -m "$1" &&
git pull &&
git push -u origin main
#如果想要同步gitlab,就执行下面这一行
#git push -u origin_gitlab main