# machine-share

This is a small script that attempts to provide the missing import/export
functionality in docker machine (see issue
[23](https://github.com/docker/machine/issues/23))

## installation 

```
cd machine-share
npm install -g
```

## exporting machines

```
machine-export <machine-name>
>> exported to <machine-name>.tar.gz 
```

## importing machines

Machine `<machine-name>` should not exist, or you'll have to delete it before import.

```
machine-import <machine-name>.tar.gz
>> imported
```


