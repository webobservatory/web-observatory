cd app
if [ $1 = "--reset" ]; then
    echo "reseting meteor database"
    meteor reset
fi

meteor run --settings settings.json
cd ..