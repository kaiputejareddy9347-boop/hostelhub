param(
    [Parameter(ValueFromRemainingArguments=$true)]
    $mvnArgs
)

$javaPath = "C:\Program Files\Java\jdk-24\bin\java.exe"
$mavenHome = "C:\Users\kaipu\.gemini\antigravity\scratch\HostelHub\build-tools\apache-maven-3.9.6"
$classworldJar = "$mavenHome\boot\plexus-classworlds-2.7.0.jar"
$m2Conf = "$mavenHome\bin\m2.conf"

& $javaPath -classpath $classworldJar `
    "-Dclassworlds.conf=$m2Conf" `
    "-Dmaven.home=$mavenHome" `
    "-Dmaven.multiModuleProjectDirectory=$PSScriptRoot" `
    org.codehaus.plexus.classworlds.launcher.Launcher `
    $mvnArgs
