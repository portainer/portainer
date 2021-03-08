Name:           portainer
Version:        2.0.0
Release:        0
License:        Zlib
Summary:        A lightweight docker management UI
Url:            https://portainer.io
Group:          BLAH
Source0:        https://github.com/portainer/portainer/releases/download/%{version}/portainer-%{version}-linux-amd64.tar.gz
Source1:        portainer.service
BuildRoot:      %{_tmppath}/%{name}-%{version}-build
%if 0%{?suse_version}
BuildRequires:  help2man
%endif
Requires:       docker
%{?systemd_requires}
BuildRequires: systemd

## HowTo build ## 
# You can use spectool to fetch sources
# spectool -g -R distribution/portainer.spec 
# Then build with 'rpmbuild -ba distribution/portainer.spec' 


%description
Portainer is a lightweight management UI which allows you to easily manage
your different Docker environments (Docker hosts or Swarm clusters).
Portainer is meant to be as simple to deploy as it is to use.
It consists of a single container that can run on any Docker engine
(can be deployed as Linux container or a Windows native container).
Portainer allows you to manage your Docker containers, images, volumes,
networks and more ! It is compatible with the standalone Docker engine and with Docker Swarm mode.

%prep
%setup -qn portainer

%build
%if 0%{?suse_version}
help2man -N --no-discard-stderr ./portainer  > portainer.1
%endif

%install
# Create directory structure
install -D -m 0755 portainer %{buildroot}%{_sbindir}/portainer
install -d -m 0755 %{buildroot}%{_datadir}/portainer/public
install -d -m 0755 %{buildroot}%{_localstatedir}/lib/portainer
install -D -m 0644 %{S:1} %{buildroot}%{_unitdir}/portainer.service
%if 0%{?suse_version}
install -D -m 0644 portainer.1 %{buildroot}%{_mandir}/man1/portainer.1
( cd  %{buildroot}%{_sbindir} ; ln -s service rcportainer )
%endif
# populate
# don't install docker binary with package use system wide installed one
cp -ra public/ %{buildroot}%{_datadir}/portainer/

%pre
%if 0%{?suse_version}
%service_add_pre portainer.service
#%%else # this does not work on rhel 7?
#%%systemd_pre portainer.service
true
%endif

%preun
%if 0%{?suse_version}
%service_del_preun portainer.service
%else
%systemd_preun portainer.service
%endif

%post
%if 0%{?suse_version}
%service_add_post portainer.service
%else
%systemd_post portainer.service
%endif

%postun
%if 0%{?suse_version}
%service_del_postun portainer.service
%else
%systemd_postun_with_restart portainer.service
%endif


%files
%defattr(-,root,root)
%{_sbindir}/portainer
%{_datadir}/portainer/public
%dir %{_localstatedir}/lib/portainer/
%{_unitdir}/portainer.service
%if 0%{?suse_version}
%{_mandir}/man1/portainer.1*
%{_sbindir}/rcportainer
%endif
