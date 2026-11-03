; Inno Setup script for Senri (Windows x64). Built by .github/workflows/senri-windows.yml.
#define AppName "Senri"
#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif
#define AppExe "Senri.exe"

[Setup]
AppId={{9CF83ABF-A786-4589-9AD5-1834B4BD1515}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Senri
AppComments=Apprendre le japonais et l'espagnol
DefaultDirName={autopf}\Senri
DefaultGroupName=Senri
DisableProgramGroupPage=yes
OutputDir=..\build\installer
OutputBaseFilename=Senri-Setup-{#AppVersion}
SetupIconFile=..\windows\runner\resources\app_icon.ico
UninstallDisplayIcon={app}\{#AppExe}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
MinVersion=10.0.17763

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Senri"; Filename: "{app}\{#AppExe}"; AppUserModelID: "Senri"
Name: "{autodesktop}\Senri"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,Senri}"; Flags: nowait postinstall skipifsilent
