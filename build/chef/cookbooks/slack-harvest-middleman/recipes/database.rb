mysqlAppNode = node[:application][:mysql]
mysqlRootPassword = node[:mysql][:server_root_password]

# Create application database
execute "create \"#{mysqlAppNode[:database]}\" database" do
  command "/usr/bin/mysql -u root -p#{mysqlRootPassword} -D mysql -r -B -N -e \"CREATE DATABASE IF NOT EXISTS #{mysqlAppNode[:database]}\"";
end

# Add database user accounts
execute "create database user: #{mysqlAppNode[:username]}" do
  command "/usr/bin/mysql -u root -p#{mysqlRootPassword} -D mysql -r -B -N -e \"CREATE USER #{mysqlAppNode[:username]}@'%' IDENTIFIED BY '#{mysqlAppNode[:plainPassword]}'\""
  action :run
  only_if { `/usr/bin/mysql -u root -p#{mysqlRootPassword} -D mysql -r -B -N -e \"SELECT COUNT(*) FROM user where User='#{mysqlAppNode[:username]}' and Host = '%'"`.to_i == 0 }
end

# Grant user database perms
execute "grant database user: #{mysqlAppNode[:username]}" do
  command "/usr/bin/mysql -u root -p#{mysqlRootPassword} -D mysql -r -B -N -e \"GRANT ALL PRIVILEGES ON *.* TO '#{mysqlAppNode[:username]}'@'%' IDENTIFIED BY '#{mysqlAppNode[:plainPassword]}'\""
  action :run
end

# Allow remote access to database
execute "remote mysql access" do
  command "echo \"bind.address = 0.0.0.0\" >> /etc/mysql/my.cnf"
end

service "mysql" do
  action :restart
end