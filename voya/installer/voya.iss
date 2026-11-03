; Inno Setup script for Voya (Windows x64). Built by .github/workflows/voya-windows.yml.
#define AppName "Voya"
#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif
#define AppExe "Voya.exe"

[Setup]
AppId={{6E3B7C52-1C3E-4D0A-9F7E-5A0C8B2D9A41}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Voya
AppComments=Apprendre le japonais et l'espagnol
DefaultDirName={autopf}\Voya
DefaultGroupName=Voya
DisableProgramGroupPage=yes
OutputDir=..\build\installer
OutputBaseFilename=Voya-Setup-{#AppVersion}
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
Name: "{autoprograms}\Voya"; Filename: "{app}\{#AppExe}"; AppUserModelID: "Voya"
Name: "{autodesktop}\Voya"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,Voya}"; Flags: nowait postinstall skipifsilent
