include_recipe "nginx"

# nginx slack-harvest-middleman config
template "slack-harvest-middleman" do
  path "#{node['nginx']['dir']}/sites-available/slack-harvest-middleman"
  source "nginx/slack-harvest-middleman.conf.erb"
  owner "root"
  group "root"
  mode "0644"
  variables(
    :node => node
  )
  notifies :reload, resources(:service => "nginx")
end

nginx_site "slack-harvest-middleman"

# some extra useful unix packets
packages_list = %w(
  htop vim ntp ntpdate
)

packages_list.each do |name|
  package name do
    action :install
  end
end

service "ntp" do
    action :stop
end

execute "sync server clock with UTC" do
  command "ntpdate pool.ntp.org"
end

service "ntp" do
  action :start
end
