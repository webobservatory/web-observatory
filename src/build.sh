meteor npm install

rm ../build/linux_64/*
meteor build ../build/linux_64/ --architecture=os.linux.x86_64
mv ../build/linux_64/src.tar.gz ../build/linux_64/wo.tar.gz

#rm ../build/osx/*
#meteor build ../build/osx/ --architecture=os.osx.x86_64
#mv ../build/osx/src.tar.gz ../build/osx/wo.tar.gz
