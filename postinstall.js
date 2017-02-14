var fs      = require('fs');
var exec    = require('child_process').exec;
var eol     = require('os').EOL;
var globals = {};

function puts(error, stdout, stderr) {
    if( '' != stdout ){
        consolelog( stdout, false );
    }
    if( error !== null ){
        consolelog( "\nexec error: " + error, false );
    }
}

function consolelog( txt, ok ){
    if( ok ){
        console.log( '\x1b[32m', txt, '\x1b[0m' );
    } else {
        console.log( '\x1b[31m', txt, '\x1b[0m' );
    }
}

function ask(question, format, callback) {
    var stdin = process.stdin, stdout = process.stdout;

    stdin.resume();
    stdout.write("\n" + question + "\n");

    stdin.once('data', function(data) {
        data = data.toString().trim();

        if (format.test(data)) {
            callback(data);
        }
        else {
            stdout.write("It should match: "+ format +"\n");
            ask(question, format, callback);
        }
    });
}

function themeName() {
    ask("Quel le nom de domaine à utiliser (ex: starter-kit.dev sans http://) ?", /.+/, function(ret){
        globals[ 'domaine' ] = ret;

        ask("Quel est le nom du theme ?", /.+/, function(ret){
            globals[ 'theme' ] = ret;
            createVhost();
        });

    });
}

function createVhost() {
    contenu = fs.readFileSync( '/etc/hosts', 'UTF-8' );
    contenu += '127.0.0.1 ' + globals[ 'domaine' ] + eol;
    fs.writeFileSync( '/etc/hosts', contenu, 'UTF-8' );
    consolelog("> Ajout du nom de domaine " + globals[ 'domaine' ] + " dans le fichier /etc/hosts ", true );

    contenu = fs.readFileSync( '/etc/apache2/extra/httpd-vhosts.conf', 'UTF-8' );
    contenu += eol + '\
<VirtualHost *:80>' + eol + '\
    ServerName ' + globals[ 'domaine' ] + eol + '\
    DocumentRoot "' + __dirname + '/dist/"' + eol + '\
    <Directory "' + __dirname + '/dist/">' + eol + '\
        Options Indexes FollowSymLinks' + eol + '\
        AllowOverride All' + eol + '\
        Require all granted' + eol + '\
    </Directory>' + eol + '\
</VirtualHost>' + eol + '\
';
    fs.writeFileSync( '/etc/apache2/extra/httpd-vhosts.conf', contenu, 'UTF-8' );
    consolelog("> Ajout du vhost dans le fichier /etc/apache2/extra/httpd-vhosts.conf", true );

    consolelog("> Redémmarage d'Apache", true );
    exec( 'sudo apachectl -k restart', function( error, stdout, stderr ){
        paramGulpfile();
    });
}

function paramGulpfile() {
    // Modification du gulpfile
    var contenu;
    contenu = fs.readFileSync( 'gulpfile.js', 'UTF-8' );
    contenu = contenu.replace( '\'mon_theme\'', '\'' + globals[ 'theme' ] + '\'' );
    contenu = contenu.replace( '\'starter-kit.dev\'', '\'' + globals[ 'domaine' ] + '\'' );
    fs.writeFileSync( 'gulpfile.js', contenu, 'UTF-8' );

    // Renomme le dossier thème
    fs.rename('src/mon_theme/', 'src/' + globals[ 'theme' ], function( err ){
        consolelog( '> renommer le dossier montheme en ' + globals[ 'theme' ], true );
    });

    endInstall();
}

function startInstall() {
    themeName();
}

function endInstall() {
    console.log( 'Votre projet a bien été initialisé' );
    console.log( 'Vous pouvez lancer "gulp"' );
    process.exit();
}

startInstall();
